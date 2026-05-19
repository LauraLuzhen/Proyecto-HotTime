import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ShiftResponse } from "@hottime/types";

import { ApiClientError, createApi } from "../../lib/api";
import { MonthYearPicker } from "../../components/MonthYearPicker";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import {
  addDays,
  buildMonthDays,
  calendarDayNames,
  categoryName,
  endOfDay,
  endOfMonth,
  formatDay,
  formatDateTime,
  formatMonth,
  formatRange,
  palette,
  sameDay,
  sameMonth,
  startOfMonth,
  startOfWeek,
  statusLabel,
} from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";
import { tokenStorage } from "../../state/auth/storage";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

function dayTitle(date: Date) {
  const days = ["D", "L", "M", "X", "J", "V", "S"];

  return `${days[date.getDay()]} ${String(date.getDate()).padStart(2, "0")}`;
}

function shiftStartLabel(shift: ShiftResponse) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(shift.startsAt));
}

export function MyScheduleScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  async function loadMonth(targetMonth = month) {
    const userId = auth.user?.id;
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.planning.getShifts({
        userId,
        published: true,
        startsFrom: startOfMonth(targetMonth),
        startsTo: endOfMonth(targetMonth),
      });
      setShifts(result.shifts);
    } catch (err) {
      const e = err as ApiClientError;
      setShifts([]);
      setError(e.message ?? "No se pudo cargar tu horario mensual.");
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
    void loadMonth(month);
  }, [auth.user?.id, month]);

  useRefreshOnFocus(() => {
    void loadMonth(month);
  }, [auth.user?.id, month]);

  const days = buildMonthDays(month);
  const selectedShifts = shifts.filter((shift) => sameDay(shift.startsAt, selectedDay));
  const weekStart = startOfWeek(selectedDay);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandBackdrop />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadMonth(month)} />}
      >

        <View style={styles.panel}>
          <View style={styles.monthHeader}>
            <Pressable style={styles.navButton} onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                <MaterialIcons name="arrow-back-ios" size={16} color={palette.accent} />
            </Pressable>
            <View style={styles.monthCenter}>
              <Pressable style={styles.monthTitleButton} onPress={() => setMonthPickerOpen(true)}>
                <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
              </Pressable>
            </View>
            <Pressable style={styles.navButton} onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
              <MaterialIcons name="arrow-forward-ios" size={16} color={palette.accent} />
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
            <Text style={styles.todayButtonText}>Volver a hoy</Text>
          </Pressable>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.accent} />
              <Text style={styles.muted}>Cargando horario...</Text>
            </View>
          ) : (
            <>
              <View style={styles.weekRow}>
                {calendarDayNames.map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}
              </View>
              <View style={styles.calendarGrid}>
                {days.map((day) => {
                  const dayShifts = shifts.filter((shift) => sameDay(shift.startsAt, day));
                  const inMonth = sameMonth(day, month);
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
                      <Text style={[styles.dayHint, selected && styles.dayHintSelected]}>{dayShifts.length ? `${dayShifts.length} turnos` : "Libre"}</Text>
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
            <Text style={styles.sectionTitle}>Turnos del {formatDay(selectedDay)}</Text>
            <Text style={styles.panelHint}>{formatDateTime(selectedDay)}</Text>
          </View>
          {selectedShifts.length ? (
            <View style={styles.shiftList}>
              {selectedShifts.map((shift) => (
                <View key={shift.id} style={styles.shiftCard}>
                  <View style={styles.shiftTop}>
                    <Text style={styles.shiftTime}>{formatRange(shift)}</Text>
                    <Text style={[styles.badge, !shift.published && styles.badgeDraft]}>{shift.published ? "Publicado" : "Borrador"}</Text>
                  </View>
                  <Text style={styles.shiftMeta}>{categoryName(shift)} · {statusLabel(shift.status)}</Text>
                  <Text style={styles.shiftMeta}>Inicio exacto {formatDateTime(shift.startsAt)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No tienes turnos publicados este dÃ­a.</Text>
          )}
        </View>
      </ScrollView>

      <MonthYearPicker
        title="Elegir mes y aÃ±o"
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
    borderRadius: 18,
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
    fontSize: 18,
    fontWeight: "800",
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
  monthSubtitle: {
    color: palette.muted,
    fontSize: 12,
    textAlign: "center",
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
  navButtonText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: "800",
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
    marginTop: 8,
    marginHorizontal: -2,
  },
  dayCell: {
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "13.0%",
    margin: 2,
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
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
  shiftList: {
    gap: 10,
  },
  shiftCard: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
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
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  shiftMeta: {
    color: palette.muted,
  },
  badge: {
    backgroundColor: "#e6f1ec",
    borderRadius: 999,
    color: palette.success,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDraft: {
    backgroundColor: "#eef3ff",
    color: palette.warning,
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
  weekCalendar: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
    marginTop: 12,
  },
  weekDayCard: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    flex: 1,
    minWidth: 0,
    padding: 8,
  },
  weekDayTitle: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  weekDayCount: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  weekShiftChip: {
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  weekShiftChipTime: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "800",
  },
  weekShiftChipStatus: {
    color: palette.muted,
    fontSize: 10,
  },
  weekShiftMore: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: "700",
  },
});




