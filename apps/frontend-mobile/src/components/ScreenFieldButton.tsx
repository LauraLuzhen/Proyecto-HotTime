import { Pressable, Text } from "react-native";

import { screenSharedStyles as styles } from "../lib/mobileStyles";

type Props = {
  label: string;
  value: string;
  onPress: () => void;
};

export function ScreenFieldButton({ label, value, onPress }: Props) {
  return (
    <Pressable style={styles.fieldButton} onPress={onPress}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </Pressable>
  );
}
