import { StyleSheet, Text, View } from "react-native";

import { palette } from "../lib/schedule";

type Props = {
  label: string;
  value?: string | null;
};

export function DashboardInfoCard({ label, value }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minWidth: "48%",
    padding: 12,
  },
  label: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  value: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
  },
});
