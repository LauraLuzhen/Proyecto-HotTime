import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Modal, Pressable, Platform, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  value: Date;
  title?: string;
  onClose: () => void;
  onSelect: (value: Date) => void;
};

export function MonthYearPicker({ visible, value, title = "Elegir mes", onClose, onSelect }: Props) {
  function onChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === "dismissed" || !date) {
      onClose();
      return;
    }

    onSelect(new Date(date.getFullYear(), date.getMonth(), 1));
    if (Platform.OS !== "ios") onClose();
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          </View>
          <DateTimePicker
            display={Platform.OS === "ios" ? "spinner" : "default"}
            mode="date"
            onChange={onChange}
            value={value}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 12,
    padding: 16,
    width: "100%",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  title: {
    color: "#151515",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  closeText: {
    color: "#2f2f2b",
    fontWeight: "700",
  },
});
