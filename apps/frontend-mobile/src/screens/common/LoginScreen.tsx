import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, View } from "react-native";
import { ApiClientError } from "../../lib/api";
import { palette } from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import { LoginOrnaments } from "../../components/LoginOrnaments";
import { ProfileTextField } from "../../components/ProfileFields";

import { authStyles as styles } from "../../lib/mobileStyles";
interface Props {
  onNavigateToForgotPassword: () => void;
}

export function LoginScreen({ onNavigateToForgotPassword }: Props) {
  const auth = useAuth();
  const [email, setEmail] = useState("admin@muerde.com");
  const [password, setPassword] = useState("Password1.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);
    try {
      await auth.login(email.trim(), password);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se pudo iniciar sesión.");
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
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Iniciar sesión</Text>
              <Text style={styles.cardSubtitle}>
                Accede con tu email y contraseña de HotTime.
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

            <ProfileTextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              secureTextEntry
              inputProps={{
                autoComplete: "password",
                placeholderTextColor: "#8a7f74",
              }}
            />

            {error ? (
              <Text style={styles.error}>
                El correo o la contraseña no son válidas
              </Text>
            ) : null}

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              onPress={() => void handleLogin()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.forgotButton}
              onPress={onNavigateToForgotPassword}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
