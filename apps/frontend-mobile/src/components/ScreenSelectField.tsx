import { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "../lib/schedule";

type Option<TValue extends string | number> = {
  label: string;
  value: TValue | null;
};

type Props<TValue extends string | number> = {
  label: string;
  placeholder: string;
  valueLabel?: string;
  options: Option<TValue>[];
  onSelect: (value: TValue | null) => void;
};

export function ScreenSelectField<TValue extends string | number>({
  label,
  placeholder,
  valueLabel,
  options,
  onSelect,
}: Props<TValue>) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.button} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !valueLabel && styles.placeholder]} numberOfLines={1}>
          {valueLabel ?? placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={palette.muted} />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.optionsBox}>
            {options.map((option) => (
              <Pressable
                key={`${option.label}-${option.value ?? "all"}`}
                style={styles.option}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  label: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  button: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  value: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
  },
  placeholder: {
    color: "#777",
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  optionsBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: "70%",
    overflow: "hidden",
    width: "100%",
  },
  option: {
    borderBottomColor: "#e8ecff",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: {
    color: palette.text,
    fontSize: 16,
  },
});
