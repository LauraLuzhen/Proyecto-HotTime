import { useState } from "react";
import { Button, SafeAreaView, Text, TextInput, View } from "react-native";

import { ApiClientError } from "@hottime/api";
import { useAuth } from "../state/auth/AuthContext";

export function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState("laurarm1002@gmail.com");
  const [password, setPassword] = useState("Password1.");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>HotTime</Text>
        <Text style={{ opacity: 0.8 }}>Login para ver tu dashboard.</Text>

        <TextInput
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 12,
            padding: 12,
          }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 12,
            padding: 12,
          }}
        />

        {error && <Text style={{ color: "crimson" }}>{error}</Text>}

        <Button
          title={loading ? "Entrando..." : "Login"}
          disabled={loading}
          onPress={async () => {
            setError(null);
            setLoading(true);
            try {
              await auth.login(email, password);
            } catch (err) {
              const e = err as ApiClientError;
              setError(e.message ?? "Error");
            } finally {
              setLoading(false);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

