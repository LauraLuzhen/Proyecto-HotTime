import { useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Platform, Pressable, Text, TextInput, type TextInputProps, View } from "react-native";

import { screenSharedStyles as styles } from "../lib/mobileStyles";
import { parseProfileDateInput, toProfileDateInputValue } from "../lib/profile";

export function ProfileInfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "-"}</Text>
    </View>
  );
}

export function ProfileTextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  keyboardType = "default",
  secureTextEntry,
  error,
  inputProps,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  error?: string;
  inputProps?: TextInputProps;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={styles.textInput}
        value={value}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function ProfileDateField({
  label,
  value,
  onChangeText,
  error,
  maximumDate,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseProfileDateInput(value) ?? new Date();

  function onChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== "ios") setOpen(false);
    if (event.type === "set" && date) onChangeText(toProfileDateInputValue(date));
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.dateFieldButton} onPress={() => setOpen(true)}>
        <Text style={[styles.dateFieldText, !value && styles.dateFieldPlaceholder]}>
          {value || "DD-MM-YYYY"}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={maximumDate}
          mode="date"
          onChange={onChange}
          value={selectedDate}
        />
      ) : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}
