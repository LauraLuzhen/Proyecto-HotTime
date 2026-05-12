import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AttendanceEntity } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import {
  addDays,
  buildMonthDays,
  calendarDayNames,
  endOfDay,
  formatDateTime,
  formatDay,
  formatLongDate,
  formatMonth,
  palette,
  sameDay,
  sameMonth,
  startOfMonth,
  startOfWeek,
  startOfDay,
} from "../lib/schedule";
import { tokenStorage } from "../state/auth/storage";

function attendanceLabel(type: AttendanceEntity["type"]) {
  return type === "CLOCK_IN" ? "Entrada" : "Salida";
}

export function MyAttendanceScreen() {
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [monthAttendances, setMonthAttendances] = useState<AttendanceEntity[]>([]);
  const [selectedAttendances, setSelectedAttendances] = useState<AttendanceEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMonth(targetMonth = month, targetDay = selectedDay) {
    setLoading(true);
    setError(null);
    try {
      const [calendar, selected] = await Promise.all([
        api.attendance.getCalendar({
          date: targetMonth,
          includeWeek: false,
          includeMonth: true,
        }),
        api.attendance.getAttendances({
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

  useEffect(() => {
    void loadMonth(month, selectedDay);
  }, [month, selectedDay]);

  const days = buildMonthDays(month);
  const weekStart = startOfWeek(selectedDay);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>My attendance</Text>
          <Text style={styles.title}>Mis fichajes</Text>
          <Text style={styles.subtitle}>Un calendario mensual para revisar entradas y salidas sin caer en listas largas.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
          </View>
          <Text style={styles.monthSubtitle}>Selecciona un día para ver el detalle de tus fichajes.</Text>

          <View style={styles.navRow}>
            <Text style={styles.navLabel}>Mes</Text>
            <View style={styles.navButtons}>
              <Pressable style={styles.navActionButton} onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                <Text style={styles.navActionText}>Anterior</Text>
              </Pressable>
              <Pressable style={styles.navActionButton} onPress={() => setMonth(startOfMonth(new Date()))}>
                <Text style={styles.navActionText}>Hoy</Text>
              </Pressable>
              <Pressable style={styles.navActionButton} onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                <Text style={styles.navActionText}>Siguiente</Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.accent} />
              <Text style={styles.muted}>Cargando calendario...</Text>
            </View>
          ) : (
            <>
              <View style={styles.weekRow}>
                {calendarDayNames.map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}
              </View>
              <View style={styles.calendarGrid}>
                {days.map((day) => {
                  const count = monthAttendances.filter((attendance) => sameDay(attendance.occurredAt, day)).length;
                  const inMonth = sameMonth(day, month);
                  const selected = sameDay(day, selectedDay);
                  return (
                    <Pressable
                      key={day.toISOString()}
                      style={[styles.dayCell, !inMonth && styles.dayCellMuted, selected && styles.dayCellSelected]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.dayNumber, !inMonth && styles.dayNumberMuted, selected && styles.dayNumberSelected]}>{day.getDate()}</Text>
                      <Text style={[styles.dayHint, selected && styles.dayHintSelected]}>{count ? `${count} fichajes` : "Sin fichajes"}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

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

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Semana seleccionada</Text>
            <Text style={styles.panelHint}>{formatDay(weekStart)} - {formatDay(addDays(weekStart, 6))}</Text>
          </View>
          <View style={styles.weekSummary}>
            {Array.from({ length: 7 }).map((_, index) => {
              const day = addDays(weekStart, index);
              const count = monthAttendances.filter((attendance) => sameDay(attendance.occurredAt, day)).length;
              return (
                <View key={day.toISOString()} style={styles.weekSummaryItem}>
                  <Text style={styles.weekSummaryDay}>{formatDay(day)}</Text>
                  <Text style={styles.weekSummaryCount}>{count ? `${count} fichaje(s)` : "Libre"}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: palette.accentStrong,
    borderRadius: 18,
    gap: 8,
    padding: 18,
  },
  kicker: {
    color: "#d8ece7",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#e6f2ef",
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  monthHeader: {
    alignItems: "center",
    marginBottom: 4,
  },
  monthTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  monthSubtitle: {
    color: palette.muted,
    fontSize: 12,
    textAlign: "center",
  },
  controlsRow: {
    marginTop: 10,
  },
  navRow: {
    gap: 8,
  },
  navLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navActionButton: {
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingVertical: 10,
  },
  navActionText: {
    color: palette.accent,
    fontWeight: "800",
    textAlign: "center",
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
    gap: 6,
    marginTop: 8,
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    margin: "0.7%",
    position: "relative",
    width: "12.85%",
  },
  dayCellMuted: {
    opacity: 0.5,
  },
  dayCellSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  dayNumber: {
    color: palette.text,
    fontWeight: "800",
  },
  dayNumberMuted: {
    color: palette.muted,
  },
  dayNumberSelected: {
    color: "#fff",
  },
  dayHint: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 2,
  },
  dayHintSelected: {
    color: "#e7f4f1",
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
  errorText: {
    color: palette.danger,
    marginTop: 10,
    fontWeight: "700",
  },
  weekSummary: {
    gap: 8,
  },
  weekSummaryItem: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  weekSummaryDay: {
    color: palette.text,
    fontWeight: "800",
  },
  weekSummaryCount: {
    color: palette.muted,
    fontWeight: "700",
  },
});
