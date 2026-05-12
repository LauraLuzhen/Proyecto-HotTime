import { useEffect, useMemo, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AttendanceEntity, AttendanceType, CategoriesResponse, GeneralUserResponse, ShiftResponse } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import {
  addDays,
  buildMonthDays,
  calendarDayNames,
  categoryName,
  endOfDay,
  formatDateTime,
  formatDay,
  formatLongDate,
  formatMonth,
  formatRange,
  formatTime,
  palette,
  sameDay,
  sameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";

type PickerTarget = "occurredAt" | null;

function errorMessage(err: unknown, fallback: string) {
  const e = err as ApiClientError;
  if (e.code === "ATTENDANCE_FORBIDDEN") return "No tienes permiso para ver o modificar este fichaje.";
  if (e.code === "ATTENDANCE_NOT_FOUND") return "No se ha encontrado el fichaje.";
  if (e.code === "CLOCK_IN_ALREADY_EXISTS" || e.code === "CLOCK_OUT_ALREADY_EXISTS") return "Ya existe un fichaje de ese tipo para este turno.";
  if (e.code === "INVALID_DATE_RANGE") return "La fecha inicial debe ser anterior a la final.";
  return e.message ?? fallback;
}

function attendanceLabel(type: AttendanceType) {
  return type === "CLOCK_IN" ? "Entrada" : "Salida";
}

function attendanceColor(type: AttendanceType) {
  return type === "CLOCK_IN" ? palette.success : palette.warning;
}

function chipStyle(type: AttendanceType) {
  return type === "CLOCK_IN" ? styles.typeChipIn : styles.typeChipOut;
}

function formatDistance(value: number) {
  return `${Math.round(value)} m`;
}

export function PlanAttendanceScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const isPlanner = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [users, setUsers] = useState<GeneralUserResponse[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse[]>([]);
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [monthAttendances, setMonthAttendances] = useState<AttendanceEntity[]>([]);
  const [selectedAttendances, setSelectedAttendances] = useState<AttendanceEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editing, setEditing] = useState<AttendanceEntity | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<AttendanceType>("CLOCK_IN");
  const [occurredAt, setOccurredAt] = useState(() => new Date());
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const usersById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])) as Record<number, GeneralUserResponse>, [users]);
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])) as Record<number, CategoriesResponse>, [categories]);

  async function loadData(targetMonth = month, targetDay = selectedDay) {
    setLoading(true);
    setError(null);
    try {
      const [usersResult, categoriesResult, shiftsResult, attendancesResult, selectedResult] = await Promise.all([
        api.user.getUsers(),
        api.category.getCategories(),
        api.planning.getShifts({
          startsFrom: startOfMonth(targetMonth),
          startsTo: endOfDay(new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)),
        }),
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

      setUsers(usersResult);
      setCategories(categoriesResult);
      setShifts(shiftsResult.shifts);
      setMonthAttendances(attendancesResult.month);
      setSelectedAttendances(selectedResult.attendances);

      if (!selectedShiftId && shiftsResult.shifts.length) {
        setSelectedShiftId(shiftsResult.shifts[0].id);
      }
    } catch (err) {
      setError(errorMessage(err, "No se pudo cargar el calendario de fichajes."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isPlanner) return;
    void loadData(month, selectedDay);
  }, [month, selectedDay, isPlanner]);

  function resetForm() {
    setEditing(null);
    setSelectedShiftId(shifts[0]?.id ?? null);
    setSelectedType("CLOCK_IN");
    setOccurredAt(new Date());
    setMessage(null);
    setError(null);
  }

  function editAttendance(attendance: AttendanceEntity) {
    setEditing(attendance);
    setSelectedShiftId(attendance.shiftId);
    setSelectedType(attendance.type);
    setOccurredAt(new Date(attendance.occurredAt));
    setMessage(null);
    setError(null);
  }

  function onPickerChange(event: DateTimePickerEvent, value?: Date) {
    if (event.type === "dismissed" || !value) {
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === "occurredAt") setOccurredAt(value);
    setPickerTarget(null);
  }

  async function saveAttendance() {
    if (!selectedShiftId) {
      setError("Selecciona un turno.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (editing) {
        await api.attendance.update(editing.id, {
          shiftId: selectedShiftId,
          type: selectedType,
          occurredAt,
        });
        setMessage("Fichaje actualizado.");
      } else {
        await api.attendance.create({
          shiftId: selectedShiftId,
          type: selectedType,
          occurredAt,
        });
        setMessage("Fichaje creado.");
      }

      resetForm();
      await loadData(month, selectedDay);
    } catch (err) {
      setError(errorMessage(err, "No se pudo guardar el fichaje."));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(attendance: AttendanceEntity) {
    const user = usersById[attendance.userId]?.fullName ?? `Usuario ${attendance.userId}`;
    Alert.alert("Eliminar fichaje", `Eliminar ${attendanceLabel(attendance.type)} de ${user}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void deleteAttendance(attendance) },
    ]);
  }

  async function deleteAttendance(attendance: AttendanceEntity) {
    setSaving(true);
    setError(null);
    try {
      await api.attendance.delete(attendance.id);
      setMessage("Fichaje eliminado.");
      if (editing?.id === attendance.id) resetForm();
      await loadData(month, selectedDay);
    } catch (err) {
      setError(errorMessage(err, "No se pudo eliminar el fichaje."));
    } finally {
      setSaving(false);
    }
  }

  if (!isPlanner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.deniedBox}>
          <Text style={styles.title}>Acceso denegado</Text>
          <Text style={styles.muted}>Solo administradores y managers pueden gestionar fichajes manuales.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = buildMonthDays(month);
  const dayShifts = shifts.filter((shift) => sameDay(shift.startsAt, selectedDay));
  const dayAttendances = selectedAttendances;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Plan attendance</Text>
          <Text style={styles.title}>Planificar fichajes</Text>
          <Text style={styles.subtitle}>Calendario mensual para revisar, crear, editar y borrar entradas o salidas por turno.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.monthHeader}>
            <Pressable style={styles.navButton} onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
              <Text style={styles.navButtonText}>Anterior</Text>
            </Pressable>
            <View style={styles.monthCenter}>
              <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
              <Text style={styles.monthSubtitle}>Calendario de fichajes y turnos</Text>
            </View>
            <Pressable style={styles.navButton} onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
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
            <Text style={styles.todayButtonText}>Volver a hoy</Text>
          </Pressable>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.accent} />
              <Text style={styles.muted}>Cargando fichajes...</Text>
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
                      <Text style={[styles.dayNumber, !inMonth && styles.dayNumberMuted, selected && styles.dayNumberSelected]}>
                        {day.getDate()}
                      </Text>
                      <Text style={[styles.dayHint, selected && styles.dayHintSelected]}>{count ? `${count} fichajes` : "Sin fichajes"}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Fichajes del {formatDay(selectedDay)}</Text>
            <Text style={styles.panelHint}>{formatLongDate(selectedDay)}</Text>
          </View>
          {dayAttendances.length ? (
            <View style={styles.shiftList}>
              {dayAttendances.map((attendance) => {
                const user = usersById[attendance.userId]?.fullName ?? `Usuario ${attendance.userId}`;
                return (
                  <View key={attendance.id} style={styles.attendanceCard}>
                    <View style={styles.attendanceTop}>
                      <Text style={[styles.typeChip, chipStyle(attendance.type)]}>{attendanceLabel(attendance.type)}</Text>
                      <Text style={styles.attendanceTime}>{formatTime(attendance.occurredAt)}</Text>
                    </View>
                    <Text style={styles.shiftMeta}>{user} · turno #{attendance.shiftId}</Text>
                    <Text style={styles.shiftMeta}>Distancia {formatDistance(attendance.distanceMeters)} · {formatDateTime(attendance.occurredAt)}</Text>
                    <View style={styles.shiftActions}>
                      <Pressable style={styles.miniButton} onPress={() => editAttendance(attendance)}>
                        <Text style={styles.miniButtonText}>Editar</Text>
                      </Pressable>
                      <Pressable style={styles.dangerButton} onPress={() => confirmDelete(attendance)}>
                        <Text style={styles.dangerButtonText}>Eliminar</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>No hay fichajes en este día.</Text>
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{editing ? "Editar fichaje" : "Nuevo fichaje"}</Text>

          <Text style={styles.label}>Turnos del día</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {dayShifts.map((shift) => {
              const user = usersById[shift.userId]?.fullName ?? `Usuario ${shift.userId}`;
              const categoriesText = shift.categories.map((relation) => categoriesById[relation.categoryId]?.name).filter(Boolean).join(", ") || "Sin categoria";
              return (
                <Pressable
                  key={shift.id}
                  style={[styles.shiftChip, selectedShiftId === shift.id && styles.shiftChipSelected]}
                  onPress={() => setSelectedShiftId(shift.id)}
                >
                  <Text style={[styles.shiftChipText, selectedShiftId === shift.id && styles.shiftChipTextSelected]} numberOfLines={1}>
                    {user}
                  </Text>
                  <Text style={[styles.shiftChipMeta, selectedShiftId === shift.id && styles.shiftChipTextSelected]} numberOfLines={1}>
                    {formatRange(shift)} · {categoriesText}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.controlsRow}>
            <Pressable style={[styles.typeButton, selectedType === "CLOCK_IN" && styles.typeButtonSelected]} onPress={() => setSelectedType("CLOCK_IN")}>
              <Text style={[styles.typeButtonText, selectedType === "CLOCK_IN" && styles.typeButtonTextSelected]}>Entrada</Text>
            </Pressable>
            <Pressable style={[styles.typeButton, selectedType === "CLOCK_OUT" && styles.typeButtonSelected]} onPress={() => setSelectedType("CLOCK_OUT")}>
              <Text style={[styles.typeButtonText, selectedType === "CLOCK_OUT" && styles.typeButtonTextSelected]}>Salida</Text>
            </Pressable>
          </View>

          <View style={styles.formGrid}>
            <FieldButton label="Fecha y hora" value={formatDateTime(occurredAt)} onPress={() => setPickerTarget("occurredAt")} />
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.primaryButton, saving && styles.disabled]} disabled={saving} onPress={() => void saveAttendance()}>
              <Text style={styles.primaryButtonText}>{saving ? "Guardando..." : editing ? "Actualizar fichaje" : "Crear fichaje"}</Text>
            </Pressable>
            {editing ? (
              <Pressable style={styles.secondaryButton} onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {pickerTarget ? (
        <DateTimePicker
          value={occurredAt}
          mode="datetime"
          is24Hour
          onChange={onPickerChange}
        />
      ) : null}
    </SafeAreaView>
  );
}

function FieldButton({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.fieldButton} onPress={onPress}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </Pressable>
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
  deniedBox: {
    gap: 8,
    padding: 16,
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
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  monthCenter: {
    flex: 1,
    gap: 2,
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
    marginTop: 10,
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
  muted: {
    color: palette.muted,
    lineHeight: 20,
  },
  errorText: {
    color: palette.danger,
    marginTop: 10,
    fontWeight: "700",
  },
  successText: {
    color: palette.success,
    marginTop: 10,
    fontWeight: "700",
  },
  shiftList: {
    gap: 10,
  },
  attendanceCard: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  attendanceTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  attendanceTime: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
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
  shiftMeta: {
    color: palette.muted,
  },
  shiftActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  miniButton: {
    alignItems: "center",
    borderColor: palette.accent,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  miniButtonText: {
    color: palette.accent,
    fontWeight: "800",
  },
  dangerButton: {
    alignItems: "center",
    borderColor: "#efc0ba",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  dangerButtonText: {
    color: palette.danger,
    fontWeight: "800",
  },
  label: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 14,
    textTransform: "uppercase",
  },
  chipsRow: {
    gap: 8,
    paddingRight: 12,
  },
  shiftChip: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    minHeight: 58,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 220,
  },
  shiftChipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  shiftChipText: {
    color: palette.text,
    fontWeight: "800",
  },
  shiftChipTextSelected: {
    color: "#fff",
  },
  shiftChipMeta: {
    color: palette.muted,
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  typeButtonSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  typeButtonText: {
    color: palette.accent,
    fontWeight: "800",
  },
  typeButtonTextSelected: {
    color: "#fff",
  },
  formGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  fieldButton: {
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 68,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: palette.backgroundSoft,
  },
  fieldLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  fieldValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 14,
    flexGrow: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    color: palette.accent,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.65,
  },
});
