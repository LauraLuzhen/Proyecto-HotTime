import { useEffect, useMemo, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { CategoriesResponse, GeneralUserResponse, ShiftResponse, ShiftStatus } from "@hottime/types";

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
  startOfMonth,
  startOfWeek,
  statusLabel,
} from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";

type CategoryFilter = "all" | "none" | number;
type PublishedFilter = "all" | "published" | "draft";
type PickerTarget = "date" | "start" | "end" | null;
type AssignMode = "user" | "visible" | "category";

const shiftStatuses: ShiftStatus[] = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "MISSED"];

function errorMessage(err: unknown, fallback: string) {
  const e = err as ApiClientError;
  if (e.code === "SHIFT_OVERLAP") return "Hay un solapamiento de horarios para ese usuario.";
  if (e.code === "INVALID_DATES" || e.code === "INVALID_SHIFT_RANGE") return "La hora de inicio debe ser anterior a la de fin.";
  if (e.code === "SHIFT_HAS_ATTENDANCE") return "Este turno tiene fichajes, mejor cancela o edita antes de borrar.";
  if (e.code === "SHIFT_NOT_FOUND") return "No se ha encontrado el turno.";
  return e.message ?? fallback;
}

function combineDateAndTime(date: Date, time: Date) {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

function defaultStartTime() {
  const value = new Date();
  value.setHours(9, 0, 0, 0);
  return value;
}

function defaultEndTime() {
  const value = new Date();
  value.setHours(17, 0, 0, 0);
  return value;
}

function getShiftLabel(shift: ShiftResponse, usersById: Record<number, GeneralUserResponse>, categoriesById: Record<number, CategoriesResponse>) {
  const userName = usersById[shift.userId]?.fullName ?? `Usuario ${shift.userId}`;
  const categories = shift.categories
    .map((relation) => categoriesById[relation.categoryId]?.name)
    .filter(Boolean);
  const categoryText = categories.length ? categories.join(", ") : "Sin categoria";
  const creatorName = usersById[shift.createdById]?.fullName ?? `Usuario ${shift.createdById}`;
  return { userName, categoryText, creatorName };
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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

export function PlanSchedulesScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const isPlanner = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [users, setUsers] = useState<GeneralUserResponse[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse[]>([]);
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [userFilter, setUserFilter] = useState<"all" | number>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>("all");

  const [editing, setEditing] = useState<ShiftResponse | null>(null);
  const [assignMode, setAssignMode] = useState<AssignMode>("user");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<"none" | number>("none");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [published, setPublished] = useState(false);
  const [status, setStatus] = useState<ShiftStatus>("SCHEDULED");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const usersById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])) as Record<number, GeneralUserResponse>, [users]);
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])) as Record<number, CategoriesResponse>, [categories]);
  const visibleUsers = useMemo(() => users.filter((user) => {
    if (categoryFilter === "none") return user.categories.length === 0;
    if (typeof categoryFilter === "number") return user.categories.some((category) => category.id === categoryFilter);
    return true;
  }), [users, categoryFilter]);

  async function loadData(targetWeek = weekStart) {
    setLoading(true);
    setError(null);
    try {
      const [usersResult, categoriesResult, shiftsResult] = await Promise.all([
        api.user.getUsers(),
        api.category.getCategories(),
        api.planning.getShifts({
          from: targetWeek,
          to: endOfDay(addDays(targetWeek, 6)),
          userId: userFilter === "all" ? undefined : userFilter,
          categoryId: categoryFilter === "all" ? undefined : categoryFilter === "none" ? null : categoryFilter,
          published: publishedFilter === "all" ? undefined : publishedFilter === "published",
        }),
      ]);

      setUsers(usersResult);
      setCategories(categoriesResult);
      setShifts(shiftsResult);

      if (!selectedUserId && usersResult.length) {
        setSelectedUserId(usersResult[0].id);
      }
    } catch (err) {
      setError(errorMessage(err, "No se pudo cargar la planificacion."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isPlanner) return;
    void loadData(weekStart);
  }, [weekStart, userFilter, categoryFilter, publishedFilter, isPlanner]);

  function resetForm() {
    setEditing(null);
    setAssignMode("user");
    setSelectedUserId(users[0]?.id ?? null);
    setSelectedCategoryId("none");
    setSelectedDate(new Date());
    setStartTime(defaultStartTime());
    setEndTime(defaultEndTime());
    setPublished(false);
    setStatus("SCHEDULED");
    setMessage(null);
    setError(null);
  }

  function editShift(shift: ShiftResponse) {
    setEditing(shift);
    setAssignMode("user");
    setSelectedUserId(shift.userId);
    setSelectedCategoryId(shift.categories[0]?.categoryId ?? "none");
    setSelectedDate(new Date(shift.startsAt));
    setStartTime(new Date(shift.startsAt));
    setEndTime(new Date(shift.endsAt));
    setPublished(shift.published);
    setStatus(shift.status);
    setMessage(null);
    setError(null);
  }

  function selectedUsers() {
    if (editing) return selectedUserId ? [selectedUserId] : [];
    if (assignMode === "visible") return visibleUsers.map((user) => user.id);
    return selectedUserId ? [selectedUserId] : [];
  }

  function validateLocal(startsAt: Date, endsAt: Date, targetUserIds: number[]) {
    if (!targetUserIds.length) return "Selecciona al menos un usuario.";
    if (startsAt >= endsAt) return "La hora de inicio debe ser anterior a la de fin.";
    return null;
  }

  async function saveShift() {
    const startsAt = combineDateAndTime(selectedDate, startTime);
    const endsAt = combineDateAndTime(selectedDate, endTime);
    const targetUserIds = selectedUsers();
    const localError = validateLocal(startsAt, endsAt, targetUserIds);

    if (localError) {
      setError(localError);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const categoryId = selectedCategoryId === "none" ? null : selectedCategoryId;

      if (editing) {
        await api.planning.updateShift(editing.id, {
          startsAt,
          endsAt,
          status,
          published,
        });
        setMessage("Turno actualizado correctamente.");
      } else if (assignMode === "category") {
        await api.planning.createShiftForCategory({
          startsAt,
          endsAt,
          published,
          categoryId,
        });
        setMessage("Turnos creados por categoria.");
      } else if (assignMode === "visible") {
        await api.planning.createShiftForUsers({
          startsAt,
          endsAt,
          published,
          userIds: targetUserIds,
        });
        setMessage(`Turnos creados para ${targetUserIds.length} usuarios.`);
      } else {
        await api.planning.createShiftForUser({
          userId: targetUserIds[0],
          startsAt,
          endsAt,
          published,
        });
        setMessage("Turno creado correctamente.");
      }

      resetForm();
      await loadData(weekStart);
    } catch (err) {
      setError(errorMessage(err, "No se pudo guardar el turno."));
    } finally {
      setSaving(false);
    }
  }

  async function publishShift(shift: ShiftResponse) {
    setSaving(true);
    setError(null);
    try {
      await api.planning.updateShift(shift.id, { published: true });
      setMessage("Turno publicado.");
      await loadData(weekStart);
    } catch (err) {
      setError(errorMessage(err, "No se pudo publicar el turno."));
    } finally {
      setSaving(false);
    }
  }

  async function publishVisibleDrafts() {
    const drafts = shifts.filter((shift) => !shift.published);
    if (!drafts.length) {
      setMessage("No hay borradores visibles para publicar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await Promise.all(drafts.map((shift) => api.planning.updateShift(shift.id, { published: true })));
      setMessage(`Publicados ${drafts.length} turnos visibles.`);
      await loadData(weekStart);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron publicar todos los turnos."));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(shift: ShiftResponse) {
    const info = getShiftLabel(shift, usersById, categoriesById);
    Alert.alert(
      "Eliminar turno",
      `Eliminar ${info.userName} - ${formatLongDate(shift.startsAt)} - ${formatRange(shift)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => void deleteShift(shift),
        },
      ]
    );
  }

  async function deleteShift(shift: ShiftResponse) {
    setSaving(true);
    setError(null);
    try {
      await api.planning.deleteShift(shift.id);
      if (editing?.id === shift.id) resetForm();
      setMessage("Turno eliminado.");
      await loadData(weekStart);
    } catch (err) {
      setError(errorMessage(err, "No se pudo eliminar el turno."));
    } finally {
      setSaving(false);
    }
  }

  function onPickerChange(event: DateTimePickerEvent, value?: Date) {
    if (event.type === "dismissed" || !value) {
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === "date") setSelectedDate(value);
    if (pickerTarget === "start") setStartTime(value);
    if (pickerTarget === "end") setEndTime(value);
    setPickerTarget(null);
  }

  if (!isPlanner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.deniedBox}>
          <Text style={styles.title}>Acceso denegado</Text>
          <Text style={styles.muted}>Solo administradores y managers pueden planificar horarios.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = buildMonthDays(weekStart);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Plan schedule</Text>
          <Text style={styles.title}>Planificar horarios</Text>
          <Text style={styles.subtitle}>Vista semanal tipo calendario para crear, editar, publicar y borrar turnos sin perder contexto.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.sectionTitle}>Semana {formatDay(weekStart)} - {formatDay(addDays(weekStart, 6))}</Text>
              <Text style={styles.panelHint}>{formatMonth(weekStart)}</Text>
            </View>
            <Pressable style={styles.secondaryButton} onPress={() => setWeekStart(startOfWeek(new Date()))}>
              <Text style={styles.secondaryButtonText}>Hoy</Text>
            </Pressable>
          </View>

          <View style={styles.controlsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setWeekStart((current) => addDays(current, -7))}>
              <Text style={styles.secondaryButtonText}>Anterior</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setWeekStart((current) => addDays(current, 7))}>
              <Text style={styles.secondaryButtonText}>Siguiente</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Usuario</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Chip label="Todos" selected={userFilter === "all"} onPress={() => setUserFilter("all")} />
            {users.map((user) => (
              <Chip key={user.id} label={user.fullName} selected={userFilter === user.id} onPress={() => setUserFilter(user.id)} />
            ))}
          </ScrollView>

          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Chip label="Todas" selected={categoryFilter === "all"} onPress={() => setCategoryFilter("all")} />
            <Chip label="Sin categoria" selected={categoryFilter === "none"} onPress={() => setCategoryFilter("none")} />
            {categories.map((category) => (
              <Chip key={category.id} label={category.name} selected={categoryFilter === category.id} onPress={() => setCategoryFilter(category.id)} />
            ))}
          </ScrollView>

          <Text style={styles.label}>Publicacion</Text>
          <View style={styles.controlsRow}>
            <Chip label="Todos" selected={publishedFilter === "all"} onPress={() => setPublishedFilter("all")} />
            <Chip label="Publicados" selected={publishedFilter === "published"} onPress={() => setPublishedFilter("published")} />
            <Chip label="Borradores" selected={publishedFilter === "draft"} onPress={() => setPublishedFilter("draft")} />
          </View>

          <Pressable style={[styles.publishButton, saving && styles.disabled]} disabled={saving} onPress={() => void publishVisibleDrafts()}>
            <Text style={styles.publishButtonText}>{saving ? "Guardando..." : "Publicar borradores visibles"}</Text>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>{editing ? "Editar turno" : "Nuevo turno"}</Text>

          {!editing ? (
            <>
              <Text style={styles.label}>Asignacion</Text>
              <View style={styles.controlsRow}>
                <Chip label="Un usuario" selected={assignMode === "user"} onPress={() => setAssignMode("user")} />
                <Chip label={`Usuarios visibles (${visibleUsers.length})`} selected={assignMode === "visible"} onPress={() => setAssignMode("visible")} />
                <Chip label="Por categoria" selected={assignMode === "category"} onPress={() => setAssignMode("category")} />
              </View>
            </>
          ) : null}

          {(assignMode === "user" || editing) ? (
            <>
              <Text style={styles.label}>Usuario asignado</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {visibleUsers.map((user) => (
                  <Chip key={user.id} label={user.fullName} selected={selectedUserId === user.id} onPress={() => setSelectedUserId(user.id)} />
                ))}
              </ScrollView>
            </>
          ) : null}

          {(assignMode === "category" || editing) ? (
            <>
              <Text style={styles.label}>Categoria del turno</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                <Chip label="Sin categoria" selected={selectedCategoryId === "none"} onPress={() => setSelectedCategoryId("none")} />
                {categories.map((category) => (
                  <Chip key={category.id} label={category.name} selected={selectedCategoryId === category.id} onPress={() => setSelectedCategoryId(category.id)} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <View style={styles.formGrid}>
            <FieldButton label="Fecha" value={formatLongDate(selectedDate)} onPress={() => setPickerTarget("date")} />
            <FieldButton label="Inicio" value={formatTime(startTime)} onPress={() => setPickerTarget("start")} />
            <FieldButton label="Fin" value={formatTime(endTime)} onPress={() => setPickerTarget("end")} />
          </View>

          <Text style={styles.label}>Publicacion</Text>
          <View style={styles.controlsRow}>
            <Chip label="Borrador" selected={!published} onPress={() => setPublished(false)} />
            <Chip label="Publicado" selected={published} onPress={() => setPublished(true)} />
          </View>

          {editing ? (
            <>
              <Text style={styles.label}>Estado</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {shiftStatuses.map((item) => (
                  <Chip key={item} label={statusLabel(item)} selected={status === item} onPress={() => setStatus(item)} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable style={[styles.primaryButton, saving && styles.disabled]} disabled={saving} onPress={() => void saveShift()}>
              <Text style={styles.primaryButtonText}>{saving ? "Guardando..." : editing ? "Actualizar turno" : "Crear turno"}</Text>
            </Pressable>
            {editing ? (
              <Pressable style={styles.secondaryButton} onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
            ) : null}
          </View>

          {message ? <Text style={styles.successText}>{message}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Calendario de turnos</Text>
            <Text style={styles.panelHint}>{loading ? "Cargando..." : `${shifts.length} turnos`}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.accent} />
              <Text style={styles.muted}>Cargando planificacion...</Text>
            </View>
          ) : (
            <View style={styles.calendarWrap}>
              <View style={styles.weekRow}>
                {calendarDayNames.map((day) => (
                  <Text key={day} style={styles.weekLabel}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {days.map((day) => {
                  const dayShifts = shifts.filter((shift) => sameDay(shift.startsAt, day));
                  const inMonth = sameMonth(day, weekStart);
                  return (
                    <View key={day.toISOString()} style={[styles.dayCell, !inMonth && styles.dayCellMuted]}>
                      <Text style={[styles.dayNumber, !inMonth && styles.dayNumberMuted]}>{day.getDate()}</Text>
                      <Text style={styles.daySubtitle}>{formatDay(day)}</Text>
                      <View style={styles.cellItems}>
                        {dayShifts.slice(0, 3).map((shift) => {
                          const info = getShiftLabel(shift, usersById, categoriesById);
                          return (
                            <Pressable key={shift.id} style={[styles.shiftPill, !shift.published && styles.shiftPillDraft]} onPress={() => editShift(shift)}>
                              <Text style={styles.shiftPillText} numberOfLines={1}>
                                {formatRange(shift)}
                              </Text>
                              <Text style={styles.shiftPillMeta} numberOfLines={1}>
                                {info.userName}
                              </Text>
                            </Pressable>
                          );
                        })}
                        {dayShifts.length > 3 ? <Text style={styles.moreText}>+{dayShifts.length - 3} más</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.sectionTitle}>Detalle por día</Text>
            <Text style={styles.panelHint}>Toca un turno para editarlo</Text>
          </View>
          {shifts.length ? (
            <View style={styles.dayList}>
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(weekStart, index);
                const dayShifts = shifts.filter((shift) => sameDay(shift.startsAt, day));
                return (
                  <View key={day.toISOString()} style={styles.dayGroup}>
                    <Text style={styles.dayTitle}>{formatLongDate(day)}</Text>
                    {dayShifts.length ? dayShifts.map((shift) => {
                      const info = getShiftLabel(shift, usersById, categoriesById);
                      return (
                        <View key={shift.id} style={styles.shiftCard}>
                          <Pressable style={styles.shiftBody} onPress={() => editShift(shift)}>
                            <View style={styles.shiftTop}>
                              <Text style={styles.shiftName}>{info.userName}</Text>
                              <Text style={[styles.badge, !shift.published && styles.badgeDraft]}>{shift.published ? "Publicado" : "Borrador"}</Text>
                            </View>
                            <Text style={styles.shiftTime}>{formatRange(shift)}</Text>
                            <Text style={styles.shiftMeta}>{info.categoryText} · {statusLabel(shift.status)}</Text>
                            <Text style={styles.shiftMeta}>Creado por {info.creatorName}</Text>
                            <Text style={styles.shiftMeta}>Inicio exacto {formatDateTime(shift.startsAt)}</Text>
                          </Pressable>
                          <View style={styles.shiftActions}>
                            {!shift.published ? (
                              <Pressable style={styles.miniButton} onPress={() => void publishShift(shift)}>
                                <Text style={styles.miniButtonText}>Publicar</Text>
                              </Pressable>
                            ) : null}
                            <Pressable style={styles.dangerButton} onPress={() => confirmDelete(shift)}>
                              <Text style={styles.dangerButtonText}>Eliminar</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    }) : (
                      <Text style={styles.muted}>Sin turnos.</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>No hay turnos con estos filtros.</Text>
          )}
        </View>
      </ScrollView>

      {pickerTarget ? (
        <DateTimePicker
          value={pickerTarget === "date" ? selectedDate : pickerTarget === "start" ? startTime : endTime}
          mode={pickerTarget === "date" ? "date" : "time"}
          is24Hour
          onChange={onPickerChange}
        />
      ) : null}
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
    backgroundColor: palette.accent,
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
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  panelHint: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
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
  controlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 12,
  },
  chip: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    maxWidth: 220,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipText: {
    color: palette.accent,
    fontWeight: "700",
  },
  chipTextSelected: {
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
  publishButton: {
    alignItems: "center",
    backgroundColor: palette.warning,
    borderRadius: 14,
    marginTop: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  publishButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.65,
  },
  loadingBox: {
    alignItems: "center",
    gap: 8,
    padding: 22,
  },
  muted: {
    color: palette.muted,
    lineHeight: 20,
  },
  successText: {
    color: palette.success,
    marginTop: 10,
    fontWeight: "700",
  },
  errorText: {
    color: palette.danger,
    marginTop: 10,
    fontWeight: "700",
  },
  calendarWrap: {
    gap: 8,
    marginTop: 8,
  },
  weekRow: {
    flexDirection: "row",
    gap: 6,
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
  },
  dayCell: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    minHeight: 128,
    padding: 10,
    width: "13.4%",
  },
  dayCellMuted: {
    opacity: 0.55,
  },
  dayNumber: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
  },
  dayNumberMuted: {
    color: palette.muted,
  },
  daySubtitle: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  cellItems: {
    gap: 6,
  },
  shiftPill: {
    backgroundColor: "#eef6f3",
    borderColor: "#d6e7e2",
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  shiftPillDraft: {
    backgroundColor: "#fff5e9",
    borderColor: "#f5d8b8",
  },
  shiftPillText: {
    color: palette.text,
    fontSize: 11,
    fontWeight: "800",
  },
  shiftPillMeta: {
    color: palette.muted,
    fontSize: 10,
  },
  moreText: {
    color: palette.warning,
    fontSize: 10,
    fontWeight: "800",
  },
  dayList: {
    gap: 12,
    marginTop: 12,
  },
  dayGroup: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10,
  },
  dayTitle: {
    color: palette.text,
    fontWeight: "800",
  },
  shiftCard: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  shiftBody: {
    gap: 6,
  },
  shiftTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  shiftName: {
    color: palette.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  shiftTime: {
    color: palette.text,
    fontWeight: "800",
  },
  shiftMeta: {
    color: palette.muted,
    lineHeight: 19,
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
    backgroundColor: "#fff5df",
    color: palette.warning,
  },
  shiftActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
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
});
