import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, SafeAreaView, ScrollView,  Text, View } from "react-native";
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

import { myAttendanceStyles as styles } from "../../lib/mobileStyles";
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

