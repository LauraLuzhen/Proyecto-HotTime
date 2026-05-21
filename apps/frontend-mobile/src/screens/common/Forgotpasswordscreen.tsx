import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiClientError, createApi } from "../../lib/api";
import { palette } from "../../lib/schedule";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import { LoginOrnaments } from "../../components/LoginOrnaments";
import { ProfileTextField } from "../../components/ProfileFields";

interface Props {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const api = createApi(() => null);

  async function handleSubmit() {
    setError(null);

    if (!email.trim()) {
      setError("Introduce tu email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Introduce un email válido.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.forgotPassword({ email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandBackdrop />
      <LoginOrnaments />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            {submitted ? (
              // Estado de éxito
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✉️</Text>
                </View>
                <Text style={styles.cardTitle}>Revisa tu correo</Text>
                <Text style={styles.cardSubtitle}>
                  Si el email está registrado, recibirás un enlace para restablecer tu contraseña. El enlace caduca en 30 minutos.
                </Text>
                <Pressable style={styles.button} onPress={onBack}>
                  <Text style={styles.buttonText}>Volver al inicio de sesión</Text>
                </Pressable>
              </View>
            ) : (
              // Formulario
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>¿Olvidaste tu contraseña?</Text>
                  <Text style={styles.cardSubtitle}>
                    Introduce tu email y te enviaremos un enlace para restablecerla.
                  </Text>
                </View>

                <ProfileTextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="usuario@correo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  inputProps={{
                    autoComplete: "email",
                    placeholderTextColor: "#8a7f74",
                  }}
                />

                {error ? (
                  <Text style={styles.error}>{error}</Text>
                ) : null}

                <Pressable
                  style={[styles.button, loading && styles.buttonDisabled]}
                  disabled={loading}
                  onPress={() => void handleSubmit()}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Enviar enlace</Text>
                  )}
                </Pressable>

                <Pressable style={styles.backButton} onPress={onBack}>
                  <Text style={styles.backText}>← Volver al inicio de sesión</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: "#eef3ff",
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
    gap: 18,
  },
  card: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 4,
  },
  backText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  error: {
    backgroundColor: "#fff1f0",
    borderColor: "#f0b8af",
    borderRadius: 14,
    borderWidth: 1,
    color: palette.danger,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successContainer: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  successIcon: {
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    borderRadius: 50,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  successIconText: {
    fontSize: 32,
  },
});