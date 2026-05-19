import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppAlert } from "../../components/AppAlert";
import { ProfileDateField, ProfileInfoRow, ProfileTextField } from "../../components/ProfileFields";
import { UserAvatar } from "../../components/UserAvatar";
import { ApiClientError } from "../../lib/api";
import {
  formatProfileDate,
  parseProfileDateInput,
  toProfileDateInputValue,
  validateProfileDate,
  validateProfileEmail,
  validateProfileName,
  validateProfilePassword,
  validateProfilePhone,
} from "../../lib/profile";
import { useAuth } from "../../state/auth/AuthContext";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";

type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "birthDate" | "password", string>>;

function categoriesLabel(categories?: { name: string }[]) {
  return categories?.length ? categories.map((c) => c.name).join(", ") : "Sin categoria";
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
    setBirthDate(toProfileDateInputValue(user.birthDate));
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
      fullName: validateProfileName(fullName),
      email: validateProfileEmail(email),
      phone: validateProfilePhone(phone),
      birthDate: validateProfileDate(birthDate),
      password: validateProfilePassword(password),
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const parsedBirthDate = parseProfileDateInput(birthDate)!;

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
          <UserAvatar uri={user?.imgProfile} name={user?.fullName} size={112} />
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.meta}>{roleLabel}</Text>
        </View>

        {/* Panel de información */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Información personal</Text>
          <ProfileInfoRow label="Email" value={user?.email} />
          <ProfileInfoRow label="Teléfono" value={user?.phone} />
          <ProfileInfoRow label="Nacimiento" value={formatProfileDate(user?.birthDate)} />
          <ProfileInfoRow label="Alta" value={formatProfileDate(user?.initDate)} />
          <ProfileInfoRow label="Categorías" value={categoriesLabel(user?.categories)} />
          <ProfileInfoRow label="Organización" value={user?.organization.name} />
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
                <UserAvatar uri={imgProfile} name={fullName} size={96} />
                <View style={styles.photoActions}>
                  <Pressable style={styles.secondaryButton} onPress={pickImage}>
                    <Text style={styles.secondaryButtonText}>Elegir de galeria</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={() => setImgProfile(null)}>
                    <Text style={styles.secondaryButtonText}>Quitar foto</Text>
                  </Pressable>
                </View>
              </View>

              <ProfileTextField label="Nombre" value={fullName} onChangeText={setFullName} error={fieldErrors.fullName} />
              <ProfileTextField
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
              />
              <ProfileTextField
                keyboardType="phone-pad"
                label="Telefono"
                value={phone}
                onChangeText={setPhone}
                error={fieldErrors.phone}
              />
              <ProfileDateField
                label="Fecha nacimiento"
                value={birthDate}
                onChangeText={setBirthDate}
                error={fieldErrors.birthDate}
                maximumDate={new Date()}
              />
              <ProfileTextField
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
