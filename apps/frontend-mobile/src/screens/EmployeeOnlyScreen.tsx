import { SafeAreaView, Text } from "react-native";

import { useAuth } from "../state/auth/AuthContext";

export function EmployeeOnlyScreen() {
  const auth = useAuth();
  if (auth.user?.role !== "EMPLOYEE") return <SafeAreaView style={{ flex: 1, padding: 16 }}><Text>Acceso denegado</Text></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Employee</Text>
      <Text style={{ marginTop: 6 }}>Pantalla vacía (solo EMPLOYEE).</Text>
    </SafeAreaView>
  );
}

