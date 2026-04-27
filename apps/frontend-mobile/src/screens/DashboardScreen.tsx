import { SafeAreaView, Text, View } from "react-native";

import { useAuth } from "../state/auth/AuthContext";

export function DashboardScreen() {
  const auth = useAuth();
  const u = auth.user;

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Dashboard</Text>
      <Text style={{ opacity: 0.8, marginTop: 4 }}>Visible para todos.</Text>

      <View style={{ marginTop: 16, padding: 14, borderWidth: 1, borderColor: "#ddd", borderRadius: 14 }}>
        <Text style={{ fontWeight: "700", marginBottom: 8 }}>Usuario logueado</Text>
        <Text>Nombre: {u?.fullName}</Text>
        <Text>Email: {u?.email}</Text>
        <Text>Rol: {u?.role}</Text>
        <Text>OrganizationId: {u?.organizationId}</Text>
      </View>
    </SafeAreaView>
  );
}

