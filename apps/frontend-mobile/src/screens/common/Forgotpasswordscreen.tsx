import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  
  Text,
  View,
} from "react-native";

import { ApiClientError, createApi } from "../../lib/api";
import { palette } from "../../lib/schedule";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import { LoginOrnaments } from "../../components/LoginOrnaments";
import { ProfileTextField } from "../../components/ProfileFields";

import { forgotPasswordStyles as styles } from "../../lib/mobileStyles";
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
