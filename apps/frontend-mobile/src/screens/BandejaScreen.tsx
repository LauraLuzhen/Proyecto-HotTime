import { SafeAreaView, Text } from "react-native";

import { useAuth } from "../state/auth/AuthContext";

export function BandejaScreen() {
  const auth = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Employee</Text>
      <Text style={{ marginTop: 6 }}>Pantalla vacía (solo EMPLOYEE).</Text>
    </SafeAreaView>
  );
}

