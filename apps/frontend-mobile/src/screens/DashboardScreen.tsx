import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ShiftResponse } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { addDays, formatDay, formatRange, publishedLabel, startOfWeek, statusLabel, categoryName } from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";

function formatDate(value?: Date) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
  );
}

function categoriesLabel(categories?: { name: string }[]) {
  return categories?.length ? categories.map((category) => category.name).join(", ") : "Sin categoria";
}

function canClockIn(shift: ShiftResponse | null) {
  if (!shift) return false;
  if (shift.attendances.some((attendance) => attendance.type === "CLOCK_IN")) return false;
  const now = Date.now();
  const startsAt = new Date(shift.startsAt).getTime();
  const endsAt = new Date(shift.endsAt).getTime();
  return now >= startsAt - 60 * 60 * 1000 && now <= endsAt;
}

function canClockOut(shift: ShiftResponse | null) {
  if (!shift) return false;
  const hasClockIn = shift.attendances.some((attendance) => attendance.type === "CLOCK_IN");
  const hasClockOut = shift.attendances.some((attendance) => attendance.type === "CLOCK_OUT");
  return hasClockIn && !hasClockOut;
}

export function DashboardScreen() {
  const auth = useAuth();
  const u = auth.user;
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [nextShift, setNextShift] = useState<ShiftResponse | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [weekShifts, setWeekShifts] = useState<ShiftResponse[]>([]);
  const [planningLoading, setPlanningLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [clockMessage, setClockMessage] = useState<string | null>(null);

  async function loadNextShift() {
    setPlanningLoading(true);
    setPlanningError(null);
    try {
      const shift = await api.planning.getNextShift();
      setNextShift(shift);
    } catch (err) {
      const e = err as ApiClientError;
      setPlanningError(e.message ?? "No se pudo cargar el proximo turno.");
    } finally {
      setPlanningLoading(false);
    }
  }

  async function loadWeek(targetWeek = weekStart) {
    setWeekLoading(true);
    setPlanningError(null);
    try {
      const shifts = await api.planning.getShifts({
        from: targetWeek,
        to: addDays(targetWeek, 7),
        published: true,
      });
      setWeekShifts(shifts);
    } catch (err) {
      const e = err as ApiClientError;
      setPlanningError(e.message ?? "No se pudo cargar el horario semanal.");
    } finally {
      setWeekLoading(false);
    }
  }

  useEffect(() => {
    void loadNextShift();
  }, []);

  useEffect(() => {
    void loadWeek(weekStart);
  }, [weekStart]);

  async function clock(type: "IN" | "OUT") {
    if (!nextShift) return;

    setClockLoading(true);
    setPlanningError(null);
    setClockMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setPlanningError("Permiso de ubicacion denegado.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const payload = {
        shiftId: nextShift.id,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      const attendance = type === "IN"
        ? await api.planning.clockIn(payload)
        : await api.planning.clockOut(payload);

      setClockMessage(`Fichaje registrado a ${Math.round(attendance.distanceMeters)} m del centro.`);
      await loadNextShift();
    } catch (err) {
      const e = err as ApiClientError;
      setPlanningError(e.message ?? "No se pudo registrar el fichaje.");
    } finally {
      setClockLoading(false);
    }
  }

  const showClockIn = canClockIn(nextShift);
  const showClockOut = canClockOut(nextShift);
  const weekEnd = addDays(weekStart, 6);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Informacion de /users/me</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Usuario logueado</Text>
          <InfoRow label="Nombre" value={u?.fullName} />
          <InfoRow label="Email" value={u?.email} />
          <InfoRow label="Rol" value={u?.role} />
          <InfoRow label="Telefono" value={u?.phone} />
          <InfoRow label="Nacimiento" value={formatDate(u?.birthDate)} />
          <InfoRow label="Alta" value={formatDate(u?.initDate)} />
          <InfoRow label="Categorias" value={categoriesLabel(u?.categories)} />
          <InfoRow label="Organizacion" value={u?.organization.name} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Fichaje</Text>
          {planningLoading ? (
            <ActivityIndicator color="#2f5f5b" />
          ) : nextShift ? (
            <>
              <InfoRow label="Proximo turno" value={`${formatDate(nextShift.startsAt)} - ${new Date(nextShift.startsAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`} />
              <InfoRow label="Radio permitido" value={u?.organization.allowedRadiusMeters ? `${u.organization.allowedRadiusMeters} m` : "Sin configurar"} />
              {showClockIn || showClockOut ? (
                <Pressable
                  style={[styles.clockButton, clockLoading && styles.clockButtonDisabled]}
                  disabled={clockLoading}
                  onPress={() => void clock(showClockOut ? "OUT" : "IN")}
                >
                  <Text style={styles.clockButtonText}>
                    {clockLoading ? "Comprobando ubicacion..." : showClockOut ? "Fichar salida" : "Fichar entrada"}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.muted}>El boton aparecera desde 1 hora antes de la entrada. La salida aparece tras fichar entrada.</Text>
              )}
            </>
          ) : (
            <Text style={styles.muted}>No hay turnos proximos publicados.</Text>
          )}
          {clockMessage ? <Text style={styles.successText}>{clockMessage}</Text> : null}
          {planningError ? <Text style={styles.errorText}>{planningError}</Text> : null}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitleNoMargin}>Horario de esta semana</Text>
            <Text style={styles.weekRange}>{formatDay(weekStart)} - {formatDay(weekEnd)}</Text>
          </View>
          <View style={styles.weekControls}>
            <Pressable style={styles.smallButton} onPress={() => setWeekStart((current) => addDays(current, -7))}>
              <Text style={styles.smallButtonText}>Anterior</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => setWeekStart(startOfWeek(new Date()))}>
              <Text style={styles.smallButtonText}>Hoy</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => setWeekStart((current) => addDays(current, 7))}>
              <Text style={styles.smallButtonText}>Siguiente</Text>
            </Pressable>
          </View>

          {weekLoading ? (
            <ActivityIndicator color="#2f5f5b" />
          ) : weekShifts.length ? (
            <View style={styles.shiftList}>
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(weekStart, index);
                const items = weekShifts.filter((shift) => new Date(shift.startsAt).toDateString() === day.toDateString());
                return (
                  <View key={day.toISOString()} style={styles.dayBlock}>
                    <Text style={styles.dayTitle}>{formatDay(day)}</Text>
                    {items.length ? items.map((shift) => (
                      <View key={shift.id} style={styles.shiftItem}>
                        <View style={styles.shiftItemTop}>
                          <Text style={styles.shiftTime}>{formatRange(shift)}</Text>
                          <Text style={[styles.shiftBadge, !shift.published && styles.shiftBadgeDraft]}>{publishedLabel(shift.published)}</Text>
                        </View>
                        <Text style={styles.shiftMeta}>{categoryName(shift)} - {statusLabel(shift.status)}</Text>
                      </View>
                    )) : (
                      <Text style={styles.muted}>Sin turno.</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>No hay turnos publicados en esta semana.</Text>
          )}
        </View>
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
    padding: 16,
    gap: 16,
  },
  title: {
    color: "#151515",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    marginTop: -10,
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  panelTitle: {
    color: "#151515",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  panelHeader: {
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 12,
  },
  panelTitleNoMargin: {
    color: "#151515",
    fontSize: 16,
    fontWeight: "700",
  },
  weekRange: {
    color: "#62625c",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weekControls: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  smallButton: {
    alignItems: "center",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
  },
  smallButtonText: {
    color: "#2f5f5b",
    fontSize: 13,
    fontWeight: "700",
  },
  shiftList: {
    gap: 10,
  },
  dayBlock: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10,
  },
  dayTitle: {
    color: "#151515",
    fontSize: 14,
    fontWeight: "700",
  },
  shiftItem: {
    backgroundColor: "#f7f7f4",
    borderColor: "#e5e5df",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  shiftItemTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  shiftTime: {
    color: "#222",
    fontSize: 15,
    fontWeight: "700",
  },
  shiftBadge: {
    backgroundColor: "#e6f1ec",
    borderRadius: 8,
    color: "#217a3f",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shiftBadgeDraft: {
    backgroundColor: "#fff5df",
    color: "#8a5a00",
  },
  shiftMeta: {
    color: "#62625c",
    fontSize: 13,
  },
  row: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
    gap: 4,
    paddingVertical: 10,
  },
  label: {
    color: "#6a6a64",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: "#222",
    fontSize: 16,
  },
  clockButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    marginTop: 8,
    minHeight: 46,
    justifyContent: "center",
  },
  clockButtonDisabled: {
    opacity: 0.65,
  },
  clockButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  muted: {
    color: "#62625c",
    lineHeight: 20,
  },
  successText: {
    color: "#217a3f",
    marginTop: 8,
  },
  errorText: {
    color: "#b42318",
    marginTop: 8,
  },
});

