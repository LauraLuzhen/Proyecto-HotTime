import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import { ApiClientError } from "../lib/api";
import { brandPalette, palette } from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { BrandBackdrop } from "../components/BrandBackdrop";

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function Ornament() {
  return (
    <>
      <View style={styles.ornamentTop} />
      <View style={styles.ornamentBottom} />
    </>
  );
}

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
      <Ornament />

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

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="usuario@correo.com"
                placeholderTextColor="#8a7f74"
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoComplete="password"
                onChangeText={setPassword}
                placeholder="Tu contrasena"
                placeholderTextColor="#8a7f74"
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

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
  hero: {
    backgroundColor: "#5f89c6",
    borderRadius: 28,
    gap: 12,
    overflow: "hidden",
    padding: 20,
  },
  kicker: {
    color: "#d8ece7",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  subtitle: {
    color: "#e6f2ef",
    fontSize: 15,
    lineHeight: 22,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  pill: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    color: "#f5fbf8",
    fontSize: 12,
    fontWeight: "800",
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
  field: {
    gap: 6,
  },
  label: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    color: palette.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  footerNote: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  ornamentTop: {
    backgroundColor: brandPalette[0],
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
    height: 220,
    opacity: 0.85,
    position: "absolute",
    right: -110,
    top: -70,
    width: 220,
  },
  ornamentBottom: {
    backgroundColor: brandPalette[4],
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    bottom: -110,
    height: 250,
    left: -110,
    opacity: 0.75,
    position: "absolute",
    width: 250,
  },
});

