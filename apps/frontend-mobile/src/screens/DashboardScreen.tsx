import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AttendanceEntity, ShiftResponse } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import {
  addDays,
  categoryName,
  formatDay,
  formatDateTime,
  formatRange,
  palette,
  sameDay,
  startOfDay,
  startOfWeek,
  statusLabel,
} from "../lib/schedule";
import { BrandBackdrop } from "../components/BrandBackdrop";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

const CLOCK_IN_WINDOW_MS = 30 * 60 * 1000;
const CLOCK_OUT_GRACE_MS = 60 * 60 * 1000;

function getAttendanceTypes(attendances: AttendanceEntity[], shiftId: number) {
  return attendances.filter((attendance) => attendance.shiftId === shiftId);
}

function canClockIn(shift: ShiftResponse | null, attendances: AttendanceEntity[]) {
  if (!shift) return false;
  if (attendances.some((attendance) => attendance.type === "CLOCK_IN")) return false;
  const now = Date.now();
  const startsAt = new Date(shift.startsAt).getTime();
  const endsAt = new Date(shift.endsAt).getTime();
  return now >= startsAt - CLOCK_IN_WINDOW_MS && now <= endsAt;
}

function canClockOut(shift: ShiftResponse | null, attendances: AttendanceEntity[]) {
  if (!shift) return false;
  const hasClockIn = attendances.some((attendance) => attendance.type === "CLOCK_IN");
  const hasClockOut = attendances.some((attendance) => attendance.type === "CLOCK_OUT");
  if (!hasClockIn || hasClockOut) return false;

  const now = Date.now();
  const endsAt = new Date(shift.endsAt).getTime();
  return now <= endsAt + CLOCK_OUT_GRACE_MS;
}

function isCurrentShift(shift: ShiftResponse, attendances: AttendanceEntity[]) {
  const now = Date.now();
  const startsAt = new Date(shift.startsAt).getTime();
  const endsAt = new Date(shift.endsAt).getTime();
  const shiftAttendances = getAttendanceTypes(attendances, shift.id);
  const hasClockIn = shiftAttendances.some((attendance) => attendance.type === "CLOCK_IN");
  const hasClockOut = shiftAttendances.some((attendance) => attendance.type === "CLOCK_OUT");

  if (hasClockOut) return false;
  if (hasClockIn) return now <= endsAt + CLOCK_OUT_GRACE_MS;
  return now >= startsAt - CLOCK_IN_WINDOW_MS && now <= endsAt;
}

function pickActiveShift(shifts: ShiftResponse[], attendances: AttendanceEntity[]) {
  const sorted = [...shifts].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  return sorted.find((shift) => isCurrentShift(shift, attendances)) ?? null;
}

function dayTitle(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
  }).format(date);
}

function dayShiftPreview(shift: ShiftResponse) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(shift.startsAt));
}

function shiftSummary(shift: ShiftResponse | null) {
  if (!shift) return "No hay turno prÃ³ximo.";
  return `${formatDay(shift.startsAt)} Â· ${formatRange(shift)}`;
}

export function DashboardScreen() {
  const auth = useAuth();
  const u = auth.user;
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [nextShift, setNextShift] = useState<ShiftResponse | null>(null);
  const [weekAttendances, setWeekAttendances] = useState<AttendanceEntity[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [currentWeekShifts, setCurrentWeekShifts] = useState<ShiftResponse[]>([]);
  const [weekShifts, setWeekShifts] = useState<ShiftResponse[]>([]);
  const [planningLoading, setPlanningLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [clockMessage, setClockMessage] = useState<string | null>(null);

  async function loadPlanning() {
    setPlanningLoading(true);
    setPlanningError(null);
    try {
      const [calendar, currentWeek, attendanceCalendar] = await Promise.all([
        api.planning.getCalendar({
          includeNext: true,
          includeWeek: false,
          includeMonth: false,
        }),
        api.planning.getShifts({
          userId: u?.id,
          startsFrom: startOfWeek(new Date()),
          startsTo: addDays(startOfWeek(new Date()), 7),
          published: true,
        }),
        api.attendance.getCalendar({
          date: new Date(),
          includeWeek: true,
          includeMonth: false,
        }),
      ]);

      setNextShift(calendar.next);
      setCurrentWeekShifts(currentWeek.shifts);
      setWeekAttendances(attendanceCalendar.week);
    } catch (err) {
      const e = err as ApiClientError;
      setPlanningError(e.message ?? "No se pudo cargar la planificacion.");
    } finally {
      setPlanningLoading(false);
    }
  }

  async function loadWeek(targetWeek = weekStart) {
    setWeekLoading(true);
    setPlanningError(null);
    try {
      const calendar = await api.planning.getShifts({
        userId: u?.id,
        startsFrom: targetWeek,
        startsTo: addDays(targetWeek, 7),
        published: true,
      });
      setWeekShifts(calendar.shifts);
    } catch (err) {
      const e = err as ApiClientError;
      setPlanningError(e.message ?? "No se pudo cargar el horario semanal.");
    } finally {
      setWeekLoading(false);
    }
  }

  useRefreshOnFocus(() => {
    void loadPlanning();
    void loadWeek(weekStart);
  }, [u?.id, weekStart]);

  useEffect(() => {
    void loadPlanning();
  }, [u?.id]);

  useEffect(() => {
    void loadWeek(weekStart);
  }, [weekStart]);

  const activeShift = pickActiveShift(currentWeekShifts, weekAttendances) ?? nextShift;
  const activeAttendances = activeShift ? getAttendanceTypes(weekAttendances, activeShift.id) : [];
  const showClockIn = canClockIn(activeShift, activeAttendances);
  const showClockOut = canClockOut(activeShift, activeAttendances);
  const refreshDashboard = () => {
    void loadPlanning();
    void loadWeek(weekStart);
  };

  async function clock(type: "IN" | "OUT") {
    if (!activeShift) return;

    setClockLoading(true);
    setPlanningError(null);
    setClockMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setPlanningError("Permiso de ubicacion denegado.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const payload = {
        shiftId: activeShift.id,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      const attendance = type === "IN"
        ? await api.planning.clockIn(payload)
        : await api.planning.clockOut(payload);

      setClockMessage(`Fichaje registrado a ${Math.round(attendance.distanceMeters)} m del centro.`);
      await loadPlanning();
      await loadWeek(weekStart);
    } catch (err) {
      const e = err as ApiClientError;
      setPlanningError(e.message ?? "No se pudo registrar el fichaje.");
    } finally {
      setClockLoading(false);
    }
  }

  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandBackdrop />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={planningLoading || weekLoading} onRefresh={refreshDashboard} />}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>HotTime</Text>
          <Text style={styles.title}>Tu jornada hoy</Text>
          <Text style={styles.subtitle}>AquÃ­ tienes el prÃ³ximo fichaje, el calendario semanal y tu informaciÃ³n principal.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Usuario logueado</Text>
          <View style={styles.infoGrid}>
            <InfoCard label="Nombre" value={u?.fullName} />
            <InfoCard label="Rol" value={u?.role} />
            <InfoCard label="Email" value={u?.email} />
            <InfoCard label="Organizacion" value={u?.organization.name} />
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Fichaje</Text>
            <Text style={styles.panelHint}>Entrada y salida con control de ubicaciÃ³n</Text>
          </View>
          {planningLoading ? (
            <ActivityIndicator color={palette.accent} />
          ) : activeShift ? (
            <>
              <Text style={styles.nextShiftTitle}>{shiftSummary(activeShift)}</Text>
              <Text style={styles.nextShiftMeta}>{categoryName(activeShift)} Â· {statusLabel(activeShift.status)}</Text>
              {showClockIn || showClockOut ? (
                <Pressable
                  style={[styles.clockButton, clockLoading && styles.clockButtonDisabled]}
                  disabled={clockLoading}
                  onPress={() => void clock(showClockOut ? "OUT" : "IN")}
                >
                  <Text style={styles.clockButtonText}>
                    {clockLoading ? "Comprobando ubicacion..." : showClockOut ? "Fichar salida" : "Fichar entrada"}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.muted}>El botÃ³n aparece 30 minutos antes y la salida se mantiene hasta 1 hora despuÃ©s del fin del turno.</Text>
              )}
            </>
          ) : (
            <Text style={styles.muted}>No hay turnos prÃ³ximos publicados.</Text>
          )}
          {clockMessage ? <Text style={styles.successText}>{clockMessage}</Text> : null}
          {planningError ? <Text style={styles.errorText}>{planningError}</Text> : null}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Horario semanal</Text>
            <Text style={styles.panelHint}>{formatDay(weekStart)} - {formatDay(weekEnd)}</Text>
          </View>
          <View style={styles.weekControls}>
            <Pressable style={styles.smallButton} onPress={() => setWeekStart((current) => addDays(current, -7))}>
              <Text style={styles.smallButtonText}>Anterior</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => setWeekStart(startOfWeek(new Date()))}>
              <Text style={styles.smallButtonText}>Hoy</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => setWeekStart((current) => addDays(current, 7))}>
              <Text style={styles.smallButtonText}>Siguiente</Text>
            </Pressable>
          </View>

          {weekLoading ? (
            <ActivityIndicator color={palette.accent} />
          ) : weekShifts.length ? (
            <View style={styles.weekCalendar}>
              {weekDays.map((day) => {
                const items = weekShifts.filter((shift) => sameDay(shift.startsAt, day));
                return (
                  <View key={day.toISOString()} style={styles.weekDayCard}>
                    <Text style={styles.weekDayTitle}>{dayTitle(day)}</Text>
                    <Text style={styles.weekDayCount}>{items.length ? `${items.length} turno(s)` : "Libre"}</Text>
                    {items.slice(0, 2).map((shift) => (
                      <View key={shift.id} style={styles.weekShiftChip}>
                        <Text style={styles.weekShiftChipTime}>{dayShiftPreview(shift)}</Text>
                        <Text style={styles.weekShiftChipStatus}>{statusLabel(shift.status)}</Text>
                      </View>
                    ))}
                    {items.length > 2 ? <Text style={styles.weekShiftMore}>+{items.length - 2} mÃ¡s</Text> : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>No hay turnos publicados en esta semana.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "-"}</Text>
    </View>
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
  panelTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  panelHint: {
    color: palette.muted,
    fontSize: 12,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoCard: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    gap: 4,
    minWidth: "48%",
    padding: 12,
  },
  infoLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  nextShiftTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },
  nextShiftMeta: {
    color: palette.muted,
    marginTop: 4,
  },
  clockButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 14,
    marginTop: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  clockButtonDisabled: {
    opacity: 0.7,
  },
  clockButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  muted: {
    color: palette.muted,
    lineHeight: 20,
  },
  successText: {
    color: palette.success,
    marginTop: 8,
    fontWeight: "700",
  },
  errorText: {
    color: palette.danger,
    marginTop: 8,
    fontWeight: "700",
  },
  weekControls: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    marginTop: 12,
  },
  smallButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  smallButtonText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: "800",
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
  dayBlock: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  dayTitle: {
    color: palette.text,
    fontWeight: "800",
  },
  shiftItem: {
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  shiftTime: {
    color: palette.text,
    fontWeight: "800",
  },
  shiftMeta: {
    color: palette.muted,
    fontSize: 12,
  },
});

