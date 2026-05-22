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

// Validación de contraseña:
// mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
import { resetPasswordStyles as styles } from "../../lib/mobileStyles";
function validatePassword(password: string): string | null {
  if (password.length < 8) return "Mínimo 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Debe incluir al menos una mayúscula.";
  if (!/[a-z]/.test(password)) return "Debe incluir al menos una minúscula.";
  if (!/[0-9]/.test(password)) return "Debe incluir al menos un número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Debe incluir al menos un carácter especial.";
  return null;
}

interface Props {
  token: string;
  onSuccess: () => void; // navega de vuelta al login
}

export function ResetPasswordScreen({ token, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const api = createApi(() => null);

  // Indicadores de requisitos de la contraseña
  const requirements = [
    { label: "8 caracteres", met: password.length >= 8 },
    { label: "Mayúscula", met: /[A-Z]/.test(password) },
    { label: "Minúscula", met: /[a-z]/.test(password) },
    { label: "Número", met: /[0-9]/.test(password) },
    { label: "Carácter especial", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const showRequirements = password.length > 0;

  async function handleReset() {
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      const e = err as ApiClientError;
      if (e.status === 400) {
        setError("El enlace ha caducado o no es válido. Solicita uno nuevo.");
      } else {
        setError(e.message ?? "No se pudo restablecer la contraseña.");
      }
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
            {done ? (
              // Estado de éxito
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>🔐</Text>
                </View>
                <Text style={styles.cardTitle}>¡Contraseña cambiada!</Text>
                <Text style={styles.cardSubtitle}>
                  Tu contraseña se ha restablecido correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                </Text>
                <Pressable style={styles.button} onPress={onSuccess}>
                  <Text style={styles.buttonText}>Iniciar sesión</Text>
                </Pressable>
              </View>
            ) : (
              // Formulario
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Nueva contraseña</Text>
                  <Text style={styles.cardSubtitle}>
                    Elige una contraseña segura para tu cuenta.
                  </Text>
                </View>

                <ProfileTextField
                  label="Nueva contraseña"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  inputProps={{
                    autoComplete: "new-password",
                    placeholderTextColor: "#8a7f74",
                  }}
                />

                {/* Indicadores de requisitos */}
                {showRequirements && (
                  <View style={styles.requirementsContainer}>
                    {requirements.map((req) => (
                      <View key={req.label} style={styles.requirementRow}>
                        <View
                          style={[
                            styles.requirementDot,
                            req.met
                              ? styles.requirementDotMet
                              : styles.requirementDotUnmet,
                          ]}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            req.met
                              ? styles.requirementTextMet
                              : styles.requirementTextUnmet,
                          ]}
                        >
                          {req.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <ProfileTextField
                  label="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  inputProps={{
                    autoComplete: "new-password",
                    placeholderTextColor: "#8a7f74",
                  }}
                />

                {error ? (
                  <Text style={styles.error}>{error}</Text>
                ) : null}

                <Pressable
                  style={[styles.button, loading && styles.buttonDisabled]}
                  disabled={loading}
                  onPress={() => void handleReset()}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Guardar contraseña</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
