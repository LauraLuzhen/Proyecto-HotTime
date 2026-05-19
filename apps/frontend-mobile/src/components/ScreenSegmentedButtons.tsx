import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "../lib/schedule";

type Item<TValue extends string> = {
  label: string;
  value: TValue;
};

type Props<TValue extends string> = {
  items: Item<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export function ScreenSegmentedButtons<TValue extends string>({ items, value, onChange }: Props<TValue>) {
  return (
    <View style={styles.row}>
      {items.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            style={[styles.button, active && styles.buttonActive]}
            onPress={() => onChange(item.value)}
          >
            <Text style={[styles.text, active && styles.textActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingVertical: 10,
  },
  buttonActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  text: {
    color: palette.accent,
    fontWeight: "700",
  },
  textActive: {
    color: "#fff",
  },
});
