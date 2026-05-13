import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { ActivityIndicator, Linking, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiClientError, createApi } from "../lib/api";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

function toInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function parseNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function OrganizationScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = auth.user?.role === "ADMIN";

  async function loadOrganization() {
    setLoading(true);
    setError(null);
    try {
      const organization = await api.organization.get();
      setName(organization.name);
      setLatitude(toInput(organization.latitude));
      setLongitude(toInput(organization.longitude));
      setRadius(toInput(organization.allowedRadiusMeters));
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se pudo cargar la organizacion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrganization();
  }, []);

  useRefreshOnFocus(() => {
    void loadOrganization();
  }, []);

  async function useCurrentLocation() {
    setLocating(true);
    setError(null);
    setMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Permiso de ubicacion denegado.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(String(current.coords.latitude));
      setLongitude(String(current.coords.longitude));
      if (!radius.trim()) setRadius("150");
      setMessage("Ubicacion actual cargada. Revisa el radio y guarda.");
    } catch {
      setError("No se pudo obtener la ubicacion actual.");
    } finally {
      setLocating(false);
    }
  }

  async function openGoogleMaps() {
    const lat = parseNullableNumber(latitude);
    const lng = parseNullableNumber(longitude);
    const url = Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : "https://www.google.com/maps";

    await Linking.openURL(url);
  }

  async function save() {
    const parsedLatitude = parseNullableNumber(latitude);
    const parsedLongitude = parseNullableNumber(longitude);
    const parsedRadius = parseNullableNumber(radius);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude) || Number.isNaN(parsedRadius)) {
      setError("Latitud, longitud y radio deben ser numeros validos.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.organization.update({
        name: name.trim(),
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        allowedRadiusMeters: parsedRadius === null ? null : Math.round(parsedRadius),
      });
      setName(updated.name);
      setLatitude(toInput(updated.latitude));
      setLongitude(toInput(updated.longitude));
      setRadius(toInput(updated.allowedRadiusMeters));
      await auth.refreshMe();
      setMessage("Organizacion actualizada.");
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se pudo guardar la organizacion.");
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Acceso denegado</Text>
          <Text style={styles.muted}>Solo ADMIN puede editar la ubicacion de fichaje.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadOrganization()} />}
      >
        <Text style={styles.title}>Organizacion</Text>
        <Text style={styles.subtitle}>Configura el punto y radio permitido para fichar.</Text>

        {loading ? (
          <View style={styles.panel}>
            <ActivityIndicator color="#2f5f5b" />
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre" />

            <View style={styles.grid}>
              <View style={styles.field}>
                <Text style={styles.label}>Latitud</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="37.3890924"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Longitud</Text>
                <TextInput
                  keyboardType="decimal-pad"
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="-5.9844589"
                />
              </View>
            </View>

            <Text style={styles.label}>Radio permitido en metros</Text>
            <TextInput
              keyboardType="number-pad"
              style={styles.input}
              value={radius}
              onChangeText={setRadius}
              placeholder="150"
            />

            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={() => void useCurrentLocation()} disabled={locating}>
                <Text style={styles.secondaryButtonText}>{locating ? "Localizando..." : "Usar mi ubicacion"}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => void openGoogleMaps()}>
                <Text style={styles.secondaryButtonText}>Abrir Google Maps</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.primaryButton, saving && styles.disabledButton]} onPress={() => void save()} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? "Guardando..." : "Guardar"}</Text>
            </Pressable>

            {message ? <Text style={styles.successText}>{message}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f4",
  },
  content: {
    gap: 14,
    padding: 16,
  },
  title: {
    color: "#151515",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#62625c",
    marginTop: -8,
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  grid: {
    gap: 10,
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#595952",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d8d8d0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#151515",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    minHeight: 46,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#2f5f5b",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.65,
  },
  muted: {
    color: "#62625c",
  },
  successText: {
    color: "#217a3f",
  },
  errorText: {
    color: "#b42318",
  },
});
