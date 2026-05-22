import { useEffect, useMemo, useState } from "react";
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, View } from "react-native";
import type { AttendanceEntity, AttendanceType, CategoriesResponse, GeneralUserResponse, ShiftResponse } from "@hottime/types";

import { useAppAlert } from "../../components/AppAlert";
import { CalendarPanel } from "../../components/CalendarPanel";
import { ScreenFieldButton } from "../../components/ScreenFieldButton";
import { ApiClientError, createApi } from "../../lib/api";
import { MonthYearPicker } from "../../components/MonthYearPicker";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import { planAttendanceStyles as styles, screenSharedStyles as calendarDayStyles } from "../../lib/mobileStyles";
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
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";
import { tokenStorage } from "../../state/auth/storage";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";

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
  const appAlert = useAppAlert();
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
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

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
          published: true,
        }),
        api.attendance.getAttendances({
          from: startOfDay(startOfMonth(targetMonth)),
          to: endOfDay(new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)),
        }),
        api.attendance.getAttendances({
          from: startOfDay(targetDay),
          to: endOfDay(targetDay),
        }),
      ]);

      setUsers(usersResult);
      setCategories(categoriesResult);
      setShifts(shiftsResult.shifts);
      setMonthAttendances(attendancesResult.attendances);
      setSelectedAttendances(selectedResult.attendances);

      const nextSelectedShiftId = selectedShiftId && shiftsResult.shifts.some((shift) => shift.id === selectedShiftId)
        ? selectedShiftId
        : shiftsResult.shifts[0]?.id ?? null;

      if (nextSelectedShiftId !== selectedShiftId) {
        setSelectedShiftId(nextSelectedShiftId);
      }
    } catch (err) {
      setError(errorMessage(err, "No se pudo cargar el calendario de fichajes."));
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
    if (!isPlanner) return;
    void loadData(month, selectedDay);
  }, [month, selectedDay, isPlanner]);

  useRefreshOnFocus(() => {
    if (!isPlanner) return;
    void loadData(month, selectedDay);
  }, [isPlanner, month, selectedDay]);

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
    if (event?.type === "dismissed" || !value) {
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === "occurredAt") setOccurredAt(value);
    setPickerTarget(null);
  }

  function openOccurredAtPicker() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: occurredAt,
        mode: "date",
        is24Hour: true,
        onChange: (dateEvent, selectedDate) => {
          if (dateEvent?.type !== "set" || !selectedDate) {
            return;
          }

          const pickedDay = selectedDate;

          DateTimePickerAndroid.open({
            value: occurredAt,
            mode: "time",
            is24Hour: true,
            onChange: (timeEvent, selectedTime) => {
              if (timeEvent?.type !== "set" || !selectedTime) {
                return;
              }

              setOccurredAt(
                new Date(
                  pickedDay.getFullYear(),
                  pickedDay.getMonth(),
                  pickedDay.getDate(),
                  selectedTime.getHours(),
                  selectedTime.getMinutes(),
                  0,
                  0
                )
              );
            },
          });
        },
      });
      return;
    }

    setPickerTarget("occurredAt");
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
    const user = usersById[attendance.userId]?.fullName ?? (attendance.userId === auth.user?.id ? auth.user.fullName : `Usuario ${attendance.userId}`);
    appAlert.showAlert({
      title: "Eliminar fichaje",
      message: `¿Eliminar ${attendanceLabel(attendance.type)} de ${user}?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => void deleteAttendance(attendance) },
      ],
    });
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
      <BrandBackdrop />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadData(month, selectedDay)} />}
      >
        <CalendarPanel
          days={days}
          error={error}
          loading={loading}
          loadingLabel="Cargando fichajes..."
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
        >
          {message ? <Text style={styles.successText}>{message}</Text> : null}
        </CalendarPanel>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Fichajes del {formatDay(selectedDay)}</Text>
            <Text style={styles.panelHint}>{formatLongDate(selectedDay)}</Text>
          </View>
          {dayAttendances.length ? (
            <View style={styles.shiftList}>
          {dayAttendances.map((attendance) => {
                const user = usersById[attendance.userId]?.fullName ?? (attendance.userId === auth.user?.id ? auth.user.fullName : `Usuario ${attendance.userId}`);
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
            <Text style={styles.muted}>No hay fichajes en este dia.</Text>
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{editing ? "Editar fichaje" : "Nuevo fichaje"}</Text>

          <Text style={styles.label}>Turnos del dia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {dayShifts.map((shift) => {
              const user = usersById[shift.userId]?.fullName ?? (shift.userId === auth.user?.id ? auth.user.fullName : `Usuario ${shift.userId}`);
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
            <ScreenFieldButton label="Fecha y hora" value={formatDateTime(occurredAt)} onPress={openOccurredAtPicker} />
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

      <MonthYearPicker
        title="Elegir mes y año"
        visible={monthPickerOpen}
        value={month}
        onClose={() => setMonthPickerOpen(false)}
        onSelect={goToMonth}
      />

      {pickerTarget && Platform.OS === "ios" ? (
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







