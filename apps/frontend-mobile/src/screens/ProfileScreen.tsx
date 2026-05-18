import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAppAlert } from "../components/AppAlert";
import { ApiClientError } from "../lib/api";
import { useAuth } from "../state/auth/AuthContext";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "birthDate" | "password", string>>;

function formatDate(value?: Date) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(value?: Date) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value)).replace(/\//g, "-");
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function validateName(value: string) {
  return value.trim().length >= 5 ? undefined : "Minimo 5 caracteres.";
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : "Formato email: correo@correo.com.";
}

function validatePhone(value: string) {
  return /^\d{9}$/.test(value.trim()) ? undefined : "Debe tener 9 digitos.";
}

function validateDate(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) return "Formato fecha: DD-MM-YYYY.";
  if (parsed >= new Date()) return "La fecha debe ser anterior a hoy.";
  return undefined;
}

function validatePassword(value: string) {
  const password = value.trim();
  if (!password) return undefined;
  if (password.length < 8) return "Minimo 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Debe tener 1 mayúscula.";
  if (!/[a-z]/.test(password)) return "Debe tener 1 minúscula.";
  if (!/[0-9]/.test(password)) return "Debe tener 1 numero.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Debe tener 1 caracter especial.";
  return undefined;
}

function initials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

function Avatar({ uri, name, size }: { uri?: string | null; name?: string; size: number }) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#e4e7ff" }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "#c4b5fd",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.32, fontWeight: "700" }}>
        {initials(name)}
      </Text>
    </View>
  );
}

function categoriesLabel(categories?: { name: string }[]) {
  return categories?.length ? categories.map((c) => c.name).join(", ") : "Sin categoria";
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  keyboardType = "default",
  secureTextEntry,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DateField({
  label,
  value,
  onChangeText,
  error,
  maximumDate,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateInput(value) ?? new Date();

  function onChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== "ios") setOpen(false);
    if (event.type === "set" && date) onChangeText(toDateInputValue(date));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.dateButton} onPress={() => setOpen(true)}>
        <Text style={[styles.dateButtonText, !value && styles.datePlaceholder]}>
          {value || "DD-MM-YYYY"}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={maximumDate}
          mode="date"
          onChange={onChange}
          value={selectedDate}
        />
      ) : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function ProfileScreen() {
  const auth = useAuth();
  const appAlert = useAppAlert();
  const user = auth.user;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [imgProfile, setImgProfile] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const roleLabel = useMemo(() => {
    if (!user?.role) return "-";
    return user.role.charAt(0) + user.role.slice(1).toLowerCase();
  }, [user?.role]);

  // Inicializa el formulario cada vez que se abre el modal de edición
  useEffect(() => {
    if (!user || !isEditing) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone);
    setBirthDate(toDateInputValue(user.birthDate));
    setPassword("");
    setImgProfile(user.imgProfile ?? null);
    setError(null);
    setFieldErrors({});
  }, [isEditing, user]);

  useRefreshOnFocus(() => {
    void auth.refreshMe();
  }, [auth]);

  async function refreshProfile() {
    setRefreshing(true);
    try {
      await auth.refreshMe();
    } finally {
      setRefreshing(false);
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      appAlert.showAlert({
        title: "Permiso necesario",
        message: "Activa el acceso a la galeria para elegir una foto.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Solo actualiza el estado local; NO se sube hasta que el usuario pulse "Guardar"
      setImgProfile(result.assets[0]?.uri ?? null);
    }
  }

  async function saveProfile() {
    const errors: FieldErrors = {
      fullName: validateName(fullName),
      email: validateEmail(email),
      phone: validatePhone(phone),
      birthDate: validateDate(birthDate),
      password: validatePassword(password),
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const parsedBirthDate = parseDateInput(birthDate)!;

    setSaving(true);
    setError(null);

    try {
      await auth.updateMe({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        birthDate: parsedBirthDate,
        imgProfile,
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      setIsEditing(false);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    setFieldErrors({});
    setError(null);
    setIsEditing(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshProfile()} />}
      >
        {/* Cabecera con avatar */}
        <View style={styles.header}>
          <Avatar uri={user?.imgProfile} name={user?.fullName} size={112} />
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.meta}>{roleLabel}</Text>
        </View>

        {/* Panel de información */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Información personal</Text>
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Teléfono" value={user?.phone} />
          <InfoRow label="Nacimiento" value={formatDate(user?.birthDate)} />
          <InfoRow label="Alta" value={formatDate(user?.initDate)} />
          <InfoRow label="Categorías" value={categoriesLabel(user?.categories)} />
          <InfoRow label="Organización" value={user?.organization.name} />
        </View>
      </ScrollView>

      {/* Botón flotante */}
      <Pressable style={styles.fab} onPress={() => setIsEditing(true)}>
        <Text style={styles.fabText}>Editar perfil</Text>
      </Pressable>

      {/* Modal de edición */}
      <Modal animationType="slide" transparent visible={isEditing} onRequestClose={cancelEditing}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar perfil</Text>

              {/* Editor de foto */}
              <View style={styles.photoEditor}>
                {/* Preview en tiempo real: muestra la imagen seleccionada o el placeholder lila */}
                <Avatar uri={imgProfile} name={fullName} size={96} />
                <View style={styles.photoActions}>
                  <Pressable style={styles.secondaryButton} onPress={pickImage}>
                    <Text style={styles.secondaryButtonText}>Elegir de galeria</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={() => setImgProfile(null)}>
                    <Text style={styles.secondaryButtonText}>Quitar foto</Text>
                  </Pressable>
                </View>
              </View>

              <Field label="Nombre" value={fullName} onChangeText={setFullName} error={fieldErrors.fullName} />
              <Field
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
              />
              <Field
                keyboardType="phone-pad"
                label="Telefono"
                value={phone}
                onChangeText={setPhone}
                error={fieldErrors.phone}
              />
              <DateField
                label="Fecha nacimiento"
                value={birthDate}
                onChangeText={setBirthDate}
                error={fieldErrors.birthDate}
                maximumDate={new Date()}
              />
              <Field
                autoCapitalize="none"
                label="Nueva password"
                placeholder="Dejala vacia para no cambiarla"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.modalActions}>
                <Pressable disabled={saving} style={styles.cancelButton} onPress={cancelEditing}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable disabled={saving} style={styles.saveButton} onPress={saveProfile}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#eef3ff",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 96,
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  name: {
    color: "#151515",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  meta: {
    color: "#676760",
    fontSize: 15,
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#d7ddff",
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
  row: {
    borderTopColor: "#e8ecff",
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
  fab: {
    backgroundColor: "#5f6df5",
    borderRadius: 8,
    bottom: 24,
    elevation: 4,
    paddingHorizontal: 18,
    paddingVertical: 14,
    position: "absolute",
    right: 16,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: "90%",
  },
  modalContent: {
    gap: 14,
    padding: 16,
    paddingBottom: 28,
  },
  modalTitle: {
    color: "#151515",
    fontSize: 20,
    fontWeight: "700",
  },
  photoEditor: {
    alignItems: "center",
    gap: 12,
  },
  photoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  secondaryButton: {
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#5f6df5",
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: "#4c4c47",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f1f1d",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButton: {
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  dateButtonText: {
    color: "#1f1f1d",
    fontSize: 16,
  },
  datePlaceholder: {
    color: "#777",
  },
  fieldError: {
    color: "#b42318",
    fontSize: 12,
  },
  error: {
    color: "#b42318",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelButton: {
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#3d3d39",
    fontWeight: "700",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#5f6df5",
    borderRadius: 8,
    minWidth: 92,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
