import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../state/auth/AuthContext";

function formatDate(value?: Date) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const auth = useAuth();
  const u = auth.user;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Informacion de /users/me</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Usuario logueado</Text>
          <InfoRow label="Nombre" value={u?.fullName} />
          <InfoRow label="Email" value={u?.email} />
          <InfoRow label="Rol" value={u?.role} />
          <InfoRow label="Telefono" value={u?.phone} />
          <InfoRow label="Nacimiento" value={formatDate(u?.birthDate)} />
          <InfoRow label="Alta" value={formatDate(u?.initDate)} />
          <InfoRow label="Categoria" value={u?.category?.name ?? "Sin categoria"} />
          <InfoRow label="Organizacion" value={u?.organization.name} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f4",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    color: "#151515",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
    marginTop: -10,
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  panelTitle: {
    color: "#151515",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
    gap: 4,
    paddingVertical: 10,
  },
  label: {
    color: "#6a6a64",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: "#222",
    fontSize: 16,
  },
});

