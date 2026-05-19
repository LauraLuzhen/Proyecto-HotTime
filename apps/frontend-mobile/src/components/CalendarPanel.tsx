import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { palette, sameDay, sameMonth } from "../lib/schedule";

type CalendarDayMeta = {
  inMonth: boolean;
  selected: boolean;
};

type Props = {
  month: Date;
  monthLabel: string;
  weekdayLabels: string[];
  days: Date[];
  loading: boolean;
  error?: string | null;
  loadingLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenMonthPicker: () => void;
  onToday: () => void;
  selectedDay: Date;
  children?: ReactNode;
  renderDay: (day: Date, meta: CalendarDayMeta) => ReactNode;
};

export function CalendarPanel({
  month,
  monthLabel,
  weekdayLabels,
  days,
  loading,
  error,
  loadingLabel,
  onPrevMonth,
  onNextMonth,
  onOpenMonthPicker,
  onToday,
  selectedDay,
  children,
  renderDay,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.monthHeader}>
        <Pressable style={styles.navButton} onPress={onPrevMonth}>
          <MaterialIcons name="arrow-back-ios" size={16} color={palette.accent} />
        </Pressable>
        <View style={styles.monthCenter}>
          <Pressable style={styles.monthTitleButton} onPress={onOpenMonthPicker}>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.navButton} onPress={onNextMonth}>
          <MaterialIcons name="arrow-forward-ios" size={16} color={palette.accent} />
        </Pressable>
      </View>

      <Pressable style={styles.todayButton} onPress={onToday}>
        <Text style={styles.todayButtonText}>Volver a hoy</Text>
      </Pressable>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.muted}>{loadingLabel}</Text>
        </View>
      ) : (
        <>
          <View style={styles.weekRow}>
            {weekdayLabels.map((day) => (
              <Text key={day} style={styles.weekLabel}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {days.map((day) => renderDay(day, { inMonth: sameMonth(day, month), selected: sameDay(day, selectedDay) }))}
          </View>
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  monthCenter: {
    flex: 1,
    gap: 2,
  },
  monthTitleButton: {
    alignSelf: "center",
  },
  monthTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "capitalize",
  },
  navButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 40,
    minWidth: 86,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  todayButton: {
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  todayButtonText: {
    color: palette.accent,
    fontWeight: "800",
  },
  loadingBox: {
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  weekRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  weekLabel: {
    color: palette.muted,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -2,
    marginTop: 8,
  },
  errorText: {
    color: palette.danger,
    marginTop: 10,
    fontWeight: "700",
  },
  muted: {
    color: palette.muted,
    lineHeight: 20,
  },
});
