import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ShiftResponse } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { addDays, addMonths, categoryName, dayNames, formatDay, formatMonth, formatRange, publishedLabel, startOfMonth, startOfWeek, statusLabel } from "../lib/schedule";
import { tokenStorage } from "../state/auth/storage";

function sameDay(a: Date | string, b: Date) {
  return new Date(a).toDateString() === b.toDateString();
}

function calendarDays(month: Date) {
  const first = startOfMonth(month);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function MyScheduleScreen() {
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMonth(targetMonth = month) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.planning.getShifts({
        from: startOfMonth(targetMonth),
        to: addMonths(startOfMonth(targetMonth), 1),
        published: true,
      });
      setShifts(result);
    } catch (err) {
      const e = err as ApiClientError;
      setShifts([]);
      setError(e.message ?? "No se pudo cargar tu horario mensual.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMonth(month);
  }, [month]);

  const days = calendarDays(month);
  const selectedShifts = shifts.filter((shift) => sameDay(shift.startsAt, selectedDay));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi horario</Text>
          <Text style={styles.subtitle}>Vision mensual de tus turnos publicados.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.monthHeader}>
            <Pressable style={styles.navButton} onPress={() => setMonth((current) => addMonths(current, -1))}>
              <Text style={styles.navButtonText}>Anterior</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
            <Pressable style={styles.navButton} onPress={() => setMonth((current) => addMonths(current, 1))}>
              <Text style={styles.navButtonText}>Siguiente</Text>
            </Pressable>
          </View>
          <Pressable
            style={styles.todayButton}
            onPress={() => {
              const today = new Date();
              setMonth(startOfMonth(today));
              setSelectedDay(today);
            }}
          >
            <Text style={styles.todayButtonText}>Volver a este mes</Text>
          </Pressable>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2f5f5b" />
              <Text style={styles.muted}>Cargando horario...</Text>
            </View>
          ) : (
            <>
              <View style={styles.weekRow}>
                {dayNames.map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}
              </View>
              <View style={styles.calendarGrid}>
                {days.map((day) => {
                  const dayShifts = shifts.filter((shift) => sameDay(shift.startsAt, day));
                  const inMonth = day.getMonth() === month.getMonth();
                  const selected = sameDay(day, selectedDay);
                  return (
                    <Pressable
                      key={day.toISOString()}
                      style={[styles.dayCell, !inMonth && styles.dayCellMuted, selected && styles.dayCellSelected]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.dayNumber, !inMonth && styles.dayNumberMuted, selected && styles.dayNumberSelected]}>
                        {day.getDate()}
                      </Text>
                      {dayShifts.length ? (
                        <View style={styles.dayCount}>
                          <Text style={styles.dayCountText}>{dayShifts.length}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Turnos del {formatDay(selectedDay)}</Text>
          {selectedShifts.length ? (
            <View style={styles.shiftList}>
              {selectedShifts.map((shift) => (
                <View key={shift.id} style={styles.shiftCard}>
                  <View style={styles.shiftTop}>
                    <Text style={styles.shiftTime}>{formatRange(shift)}</Text>
                    <Text style={[styles.badge, !shift.published && styles.badgeDraft]}>{publishedLabel(shift.published)}</Text>
                  </View>
                  <Text style={styles.shiftMeta}>{categoryName(shift)} - {statusLabel(shift.status)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No tienes turnos publicados este dia.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f7f7f4",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    color: "#151515",
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#666",
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  monthTitle: {
    color: "#151515",
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "capitalize",
  },
  navButton: {
    alignItems: "center",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    minWidth: 86,
    justifyContent: "center",
  },
  navButtonText: {
    color: "#2f5f5b",
    fontSize: 13,
    fontWeight: "700",
  },
  todayButton: {
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  todayButtonText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  loadingBox: {
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  weekRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  weekLabel: {
    color: "#6a6a64",
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    borderColor: "#eeeeea",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    margin: "0.7%",
    position: "relative",
    width: "12.85%",
  },
  dayCellMuted: {
    backgroundColor: "#fafafa",
  },
  dayCellSelected: {
    backgroundColor: "#2f5f5b",
    borderColor: "#2f5f5b",
  },
  dayNumber: {
    color: "#222",
    fontWeight: "700",
  },
  dayNumberMuted: {
    color: "#a0a09a",
  },
  dayNumberSelected: {
    color: "#fff",
  },
  dayCount: {
    alignItems: "center",
    backgroundColor: "#d86f45",
    borderRadius: 8,
    bottom: 4,
    minWidth: 16,
    paddingHorizontal: 4,
    position: "absolute",
    right: 4,
  },
  dayCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#151515",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  shiftList: {
    gap: 10,
  },
  shiftCard: {
    backgroundColor: "#f7f7f4",
    borderColor: "#e5e5df",
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  shiftTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  shiftTime: {
    color: "#222",
    fontSize: 16,
    fontWeight: "700",
  },
  shiftMeta: {
    color: "#62625c",
  },
  badge: {
    backgroundColor: "#e6f1ec",
    borderRadius: 8,
    color: "#217a3f",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeDraft: {
    backgroundColor: "#fff5df",
    color: "#8a5a00",
  },
  muted: {
    color: "#62625c",
    lineHeight: 20,
  },
  errorText: {
    color: "#b42318",
    marginTop: 10,
  },
});
