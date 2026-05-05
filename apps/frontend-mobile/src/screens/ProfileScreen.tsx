import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ApiClientError } from "../lib/api";
import { useAuth } from "../state/auth/AuthContext";

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

  return new Date(value).toISOString().slice(0, 10);
}

function initials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

function placeholderAvatarUri(name?: string) {
  const text = encodeURIComponent(initials(name));
  return `https://ui-avatars.com/api/?name=${text}&background=2f5f5b&color=ffffff&size=256&bold=true`;
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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
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
    </View>
  );
}

export function ProfileScreen() {
  const auth = useAuth();
  const user = auth.user;
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [imgProfile, setImgProfile] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUri = user?.imgProfile || placeholderAvatarUri(user?.fullName);
  const editImageUri = imgProfile || placeholderAvatarUri(fullName);

  const roleLabel = useMemo(() => {
    if (!user?.role) return "-";
    return user.role.charAt(0) + user.role.slice(1).toLowerCase();
  }, [user?.role]);

  useEffect(() => {
    if (!user || !isEditing) return;

    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone);
    setBirthDate(toDateInputValue(user.birthDate));
    setPassword("");
    setImgProfile(user.imgProfile);
    setError(null);
  }, [isEditing, user]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permiso necesario", "Activa el acceso a la galeria para elegir una foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImgProfile(result.assets[0]?.uri ?? null);
    }
  }

  async function saveProfile() {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !birthDate.trim()) {
      setError("Completa nombre, email, telefono y fecha de nacimiento.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await auth.updateMe({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        birthDate: new Date(`${birthDate}T00:00:00`),
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={{ uri: imageUri }} style={styles.avatar} />
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.meta}>{roleLabel}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Informacion personal</Text>
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Telefono" value={user?.phone} />
          <InfoRow label="Nacimiento" value={formatDate(user?.birthDate)} />
          <InfoRow label="Alta" value={formatDate(user?.initDate)} />
          <InfoRow label="Categoria" value={user?.category?.name ?? "Sin categoria"} />
          <InfoRow label="Organizacion" value={user?.organization.name} />
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setIsEditing(true)}>
        <Text style={styles.fabText}>Editar perfil</Text>
      </Pressable>

      <Modal animationType="slide" transparent visible={isEditing} onRequestClose={() => setIsEditing(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar perfil</Text>

              <View style={styles.photoEditor}>
                <Image source={{ uri: editImageUri }} style={styles.editAvatar} />
                <View style={styles.photoActions}>
                  <Pressable style={styles.secondaryButton} onPress={pickImage}>
                    <Text style={styles.secondaryButtonText}>Elegir de galeria</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={() => setImgProfile(null)}>
                    <Text style={styles.secondaryButtonText}>Quitar foto</Text>
                  </Pressable>
                </View>
              </View>

              <Field label="Nombre" value={fullName} onChangeText={setFullName} />
              <Field
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                value={email}
                onChangeText={setEmail}
              />
              <Field keyboardType="phone-pad" label="Telefono" value={phone} onChangeText={setPhone} />
              <Field
                autoCapitalize="none"
                label="Fecha nacimiento"
                placeholder="YYYY-MM-DD"
                value={birthDate}
                onChangeText={setBirthDate}
              />
              <Field
                autoCapitalize="none"
                label="Nueva password"
                placeholder="Dejala vacia para no cambiarla"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.modalActions}>
                <Pressable disabled={saving} style={styles.cancelButton} onPress={() => setIsEditing(false)}>
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
    backgroundColor: "#f7f7f4",
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
  avatar: {
    backgroundColor: "#dfe7e3",
    borderRadius: 56,
    height: 112,
    width: 112,
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
  fab: {
    backgroundColor: "#2f5f5b",
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
  editAvatar: {
    backgroundColor: "#dfe7e3",
    borderRadius: 48,
    height: 96,
    width: 96,
  },
  photoActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  secondaryButton: {
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#2f5f5b",
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
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f1f1d",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    borderColor: "#d7d7d0",
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
    backgroundColor: "#2f5f5b",
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
