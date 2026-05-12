import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
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
  startOfWeek,
  statusLabel,
} from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";

function canClockIn(shift: ShiftResponse | null, attendances: AttendanceEntity[]) {
  if (!shift) return false;
  if (attendances.some((attendance) => attendance.type === "CLOCK_IN")) return false;
  const now = Date.now();
  const startsAt = new Date(shift.startsAt).getTime();
  const endsAt = new Date(shift.endsAt).getTime();
  return now >= startsAt - 60 * 60 * 1000 && now <= endsAt;
}

function canClockOut(shift: ShiftResponse | null, attendances: AttendanceEntity[]) {
  if (!shift) return false;
  const hasClockIn = attendances.some((attendance) => attendance.type === "CLOCK_IN");
  const hasClockOut = attendances.some((attendance) => attendance.type === "CLOCK_OUT");
  return hasClockIn && !hasClockOut;
}

function shiftSummary(shift: ShiftResponse | null) {
  if (!shift) return "No hay turno próximo.";
  return `${formatDay(shift.startsAt)} · ${formatRange(shift)}`;
}

export function DashboardScreen() {
  const auth = useAuth();
  const u = auth.user;
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [nextShift, setNextShift] = useState<ShiftResponse | null>(null);
  const [nextAttendances, setNextAttendances] = useState<AttendanceEntity[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
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
      const calendar = await api.planning.getCalendar({
        includeNext: true,
        includeWeek: true,
        includeMonth: false,
      });
      setNextShift(calendar.next);
      setWeekShifts(calendar.week);
      if (calendar.next) {
        const attendances = await api.attendance.getAttendances({ shiftId: calendar.next.id });
        setNextAttendances(attendances.attendances);
      } else {
        setNextAttendances([]);
      }
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

  useEffect(() => {
    void loadPlanning();
  }, []);

  useEffect(() => {
    void loadWeek(weekStart);
  }, [weekStart]);

  async function clock(type: "IN" | "OUT") {
    if (!nextShift) return;

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
        shiftId: nextShift.id,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      const attendance = type === "IN"
        ? await api.planning.clockIn(payload)
        : await api.planning.clockOut(payload);

      setClockMessage(`Fichaje registrado a ${Math.round(attendance.distanceMeters)} m del centro.`);
      await loadPlanning();
    } catch (err) {
      const e = err as ApiClientError;
      setPlanningError(e.message ?? "No se pudo registrar el fichaje.");
    } finally {
      setClockLoading(false);
    }
  }

  const showClockIn = canClockIn(nextShift, nextAttendances);
  const showClockOut = canClockOut(nextShift, nextAttendances);
  const weekEnd = addDays(weekStart, 6);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Dashboard</Text>
          <Text style={styles.title}>Tu jornada hoy</Text>
          <Text style={styles.subtitle}>Aquí tienes el próximo fichaje, el calendario semanal y tu información principal.</Text>
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
            <Text style={styles.panelHint}>Entrada y salida con control de ubicación</Text>
          </View>
          {planningLoading ? (
            <ActivityIndicator color={palette.accent} />
          ) : nextShift ? (
            <>
              <Text style={styles.nextShiftTitle}>{shiftSummary(nextShift)}</Text>
              <Text style={styles.nextShiftMeta}>{categoryName(nextShift)} · {statusLabel(nextShift.status)}</Text>
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
                <Text style={styles.muted}>El botón aparece desde 1 hora antes del turno y la salida tras la entrada.</Text>
              )}
            </>
          ) : (
            <Text style={styles.muted}>No hay turnos próximos publicados.</Text>
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
            <View style={styles.weekGrid}>
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(weekStart, index);
                const items = weekShifts.filter((shift) => sameDay(shift.startsAt, day));
                return (
                  <View key={day.toISOString()} style={styles.dayBlock}>
                    <Text style={styles.dayTitle}>{formatDay(day)}</Text>
                    {items.length ? items.map((shift) => (
                      <View key={shift.id} style={styles.shiftItem}>
                        <Text style={styles.shiftTime}>{formatRange(shift)}</Text>
                        <Text style={styles.shiftMeta}>{statusLabel(shift.status)}</Text>
                      </View>
                    )) : (
                      <Text style={styles.muted}>Sin turno.</Text>
                    )}
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
  weekGrid: {
    gap: 10,
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
