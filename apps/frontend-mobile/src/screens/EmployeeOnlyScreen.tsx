import { useState } from "react";
import { RefreshControl, SafeAreaView, ScrollView, Text } from "react-native";

import { useAuth } from "../state/auth/AuthContext";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

export function EmployeeOnlyScreen() {
  const auth = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useRefreshOnFocus(() => {
    void auth.refreshMe();
  }, [auth]);

  async function refreshRole() {
    setRefreshing(true);
    try {
      await auth.refreshMe();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshRole()} />}
      >
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Employee</Text>
        <Text style={{ marginTop: 6 }}>Pantalla vacía (solo EMPLOYEE).</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
