import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { ApiClientError } from "../../lib/api";
import { palette } from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import { LoginOrnaments } from "../../components/LoginOrnaments";
import { ProfileTextField } from "../../components/ProfileFields";

export function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState("laurarm1002@gmail.com");
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
              <Text style={styles.cardSubtitle}>Accede con tu email y contraseña de HotTime.</Text>
            </View>

            <ProfileTextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@correo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              inputProps={{ autoComplete: "email", placeholderTextColor: "#8a7f74" }}
            />

            <ProfileTextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contrasena"
              secureTextEntry
              inputProps={{ autoComplete: "password", placeholderTextColor: "#8a7f74" }}
            />

            {error ? <Text style={styles.error}>El correo o la contraseña no son válidas</Text> : null}

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
});

