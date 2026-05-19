import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AttendanceEntity } from "@hottime/types";

import { screenSharedStyles as calendarDayStyles } from "../../lib/mobileStyles";
import { CalendarPanel } from "../../components/CalendarPanel";
import { ApiClientError, createApi } from "../../lib/api";
import { MonthYearPicker } from "../../components/MonthYearPicker";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import {
  buildMonthDays,
  calendarDayNames,
  endOfDay,
  formatDateTime,
  formatDay,
  formatLongDate,
  formatMonth,
  palette,
  sameDay,
  startOfMonth,
  startOfDay,
} from "../../lib/schedule";
import { tokenStorage } from "../../state/auth/storage";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { useAuth } from "../../state/auth/AuthContext";

function attendanceLabel(type: AttendanceEntity["type"]) {
  return type === "CLOCK_IN" ? "Entrada" : "Salida";
}

export function MyAttendanceScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [monthAttendances, setMonthAttendances] = useState<AttendanceEntity[]>([]);
  const [selectedAttendances, setSelectedAttendances] = useState<AttendanceEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  async function loadMonth(targetMonth = month, targetDay = selectedDay) {
    const userId = auth.user?.id;
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const [calendar, selected] = await Promise.all([
        api.attendance.getCalendar({
          userId,
          date: targetMonth,
          includeWeek: false,
          includeMonth: true,
        }),
        api.attendance.getAttendances({
          userId,
          from: startOfDay(targetDay),
          to: endOfDay(targetDay),
        }),
      ]);

      setMonthAttendances(calendar.month);
      setSelectedAttendances(selected.attendances);
    } catch (err) {
      const e = err as ApiClientError;
      setMonthAttendances([]);
      setSelectedAttendances([]);
      setError(e.message ?? "No se pudo cargar tu calendario de fichajes.");
    } finally {
      setLoading(false);
    }
  }

  function goToMonth(nextMonth: Date) {
    const normalized = startOfMonth(nextMonth);
    setMonth(normalized);
    setSelectedDay(normalized);
    setMonthPickerOpen(false);
  }

  useEffect(() => {
    void loadMonth(month, selectedDay);
  }, [auth.user?.id, month, selectedDay]);

  useRefreshOnFocus(() => {
    void loadMonth(month, selectedDay);
  }, [auth.user?.id, month, selectedDay]);

  const days = buildMonthDays(month);
  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandBackdrop />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadMonth(month, selectedDay)} />}
      >
        <CalendarPanel
          days={days}
          error={error}
          loading={loading}
          loadingLabel="Cargando calendario..."
          month={month}
          monthLabel={formatMonth(month)}
          onNextMonth={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          onOpenMonthPicker={() => setMonthPickerOpen(true)}
          onPrevMonth={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          onToday={() => {
            const today = new Date();
            setMonth(startOfMonth(today));
            setSelectedDay(today);
          }}
          selectedDay={selectedDay}
          weekdayLabels={calendarDayNames}
          renderDay={(day, meta) => {
            const count = monthAttendances.filter((attendance) => sameDay(attendance.occurredAt, day)).length;

            return (
              <Pressable
                key={day.toISOString()}
                style={[
                  calendarDayStyles.calendarDayCell,
                  !meta.inMonth && calendarDayStyles.calendarDayCellMuted,
                  meta.selected && calendarDayStyles.calendarDayCellSelected,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[
                    calendarDayStyles.calendarDayNumber,
                    !meta.inMonth && calendarDayStyles.calendarDayNumberMuted,
                    meta.selected && calendarDayStyles.calendarDayNumberSelected,
                  ]}
                >
                  {day.getDate()}
                </Text>
                <Text style={[calendarDayStyles.calendarDayHint, meta.selected && calendarDayStyles.calendarDayHintSelected]}>
                  {count ? `${count} fichajes` : "Libre"}
                </Text>
              </Pressable>
            );
          }}
        />

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Detalle del {formatDay(selectedDay)}</Text>
            <Text style={styles.panelHint}>{formatLongDate(selectedDay)}</Text>
          </View>

          {selectedAttendances.length ? (
            <View style={styles.list}>
              {selectedAttendances.map((attendance) => (
                <View key={attendance.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.typeChip, attendance.type === "CLOCK_IN" ? styles.typeChipIn : styles.typeChipOut]}>
                      {attendanceLabel(attendance.type)}
                    </Text>
                    <Text style={styles.time}>{formatDateTime(attendance.occurredAt)}</Text>
                  </View>
                  <Text style={styles.meta}>Turno #{attendance.shiftId}</Text>
                  <Text style={styles.meta}>Distancia {Math.round(attendance.distanceMeters)} m</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No hay fichajes en este día.</Text>
          )}
        </View>
      </ScrollView>

      <MonthYearPicker
        title="Elegir mes y año"
        visible={monthPickerOpen}
        value={month}
        onClose={() => setMonthPickerOpen(false)}
        onSelect={goToMonth}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#eef3ff",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    gap: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  kicker: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    color: palette.text,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  panelHeader: {
    gap: 4,
  },
  panelHint: {
    color: palette.muted,
    fontSize: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  typeChip: {
    borderRadius: 999,
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeChipIn: {
    backgroundColor: palette.success,
  },
  typeChipOut: {
    backgroundColor: palette.warning,
  },
  time: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: palette.muted,
  },
  muted: {
    color: palette.muted,
    lineHeight: 20,
  },
  weekSummary: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
  },
  weekSummaryItem: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    minWidth: 0,
    padding: 12,
  },
  weekSummaryDay: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "800",
  },
  weekSummaryCount: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
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
  monthCenter: {
    flex: 1,
    gap: 2,
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
});
