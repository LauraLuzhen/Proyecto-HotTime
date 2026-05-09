import { useEffect, useMemo, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import type { CategoriesResponse, GeneralUserResponse, ShiftResponse, ShiftStatus } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { addDays, categoryName, formatDay, formatRange, formatTime, publishedLabel, shiftOverlaps, startOfWeek, statusLabel } from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";

type CategoryFilter = "all" | "none" | number;
type PublishedFilter = "all" | "published" | "draft";
type PickerTarget = "date" | "start" | "end" | null;

const shiftStatuses: ShiftStatus[] = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "MISSED", "CANCELLED"];

function sameDay(a: Date | string, b: Date) {
  return new Date(a).toDateString() === b.toDateString();
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

function errorMessage(err: unknown, fallback: string) {
  const e = err as ApiClientError;
  if (e.code === "SHIFT_OVERLAP") return "Hay un solapamiento de horarios para este usuario.";
  if (e.code === "INVALID_SHIFT_RANGE") return "La hora de inicio debe ser anterior a la hora de fin.";
  if (e.code === "SHIFT_HAS_ATTENDANCE") return "No se puede borrar un turno con fichajes. Puedes cancelarlo.";
  return e.message ?? fallback;
}

export function PlanSchedulesScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
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
  const [targetMode, setTargetMode] = useState<"one" | "visible">("one");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"none" | number>("none");
  const [date, setDate] = useState(() => new Date());
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [published, setPublished] = useState(false);
  const [status, setStatus] = useState<ShiftStatus>("SCHEDULED");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const isPlanner = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";

  async function loadData(targetWeek = weekStart) {
    setLoading(true);
    setError(null);
    try {
      const [usersResult, categoriesResult, shiftsResult] = await Promise.all([
        api.user.getUsers(),
        api.category.getCategories(),
        api.planning.getShifts({
          from: targetWeek,
          to: addDays(targetWeek, 7),
          categoryId: categoryFilter === "all" ? undefined : categoryFilter === "none" ? null : categoryFilter,
          published: publishedFilter === "all" ? undefined : publishedFilter === "published",
          userId: userFilter === "all" ? undefined : userFilter,
        }),
      ]);
      setUsers(usersResult);
      setCategories(categoriesResult);
      setShifts(shiftsResult);
      if (!selectedUserId && usersResult.length) setSelectedUserId(usersResult[0].id);
    } catch (err) {
      setError(errorMessage(err, "No se pudo cargar la planificacion."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData(weekStart);
  }, [weekStart, userFilter, categoryFilter, publishedFilter]);

  function resetForm() {
    setEditing(null);
    setTargetMode("one");
    setSelectedUserId(users[0]?.id ?? null);
    setSelectedCategory("none");
    setDate(new Date());
    setStartTime(defaultStartTime());
    setEndTime(defaultEndTime());
    setPublished(false);
    setStatus("SCHEDULED");
    setMessage(null);
    setError(null);
  }

  function editShift(shift: ShiftResponse) {
    setEditing(shift);
    setTargetMode("one");
    setSelectedUserId(shift.userId);
    setSelectedCategory(shift.categoryId ?? "none");
    setDate(new Date(shift.startsAt));
    setStartTime(new Date(shift.startsAt));
    setEndTime(new Date(shift.endsAt));
    setPublished(shift.published);
    setStatus(shift.status);
    setMessage(null);
    setError(null);
  }

  function selectedUsers() {
    if (editing) return selectedUserId ? [selectedUserId] : [];
    if (targetMode === "visible") return visibleUsers.map((user) => user.id);
    return selectedUserId ? [selectedUserId] : [];
  }

  function validateLocal(startsAt: Date, endsAt: Date, targetUserIds: number[]) {
    if (!targetUserIds.length) return "Selecciona al menos un usuario.";
    if (startsAt >= endsAt) return "La hora de inicio debe ser anterior a la hora de fin.";
    const overlap = shifts.find((shift) => (
      targetUserIds.includes(shift.userId)
      && shift.status !== "CANCELLED"
      && shift.id !== editing?.id
      && shiftOverlaps({ startsAt, endsAt }, shift)
    ));
    if (overlap) return `Solape detectado: ${overlap.user.fullName} ya tiene ${formatRange(overlap)} el ${formatDay(overlap.startsAt)}.`;
    return null;
  }

  async function saveShift() {
    const startsAt = combineDateAndTime(date, startTime);
    const endsAt = combineDateAndTime(date, endTime);
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
      const categoryId = selectedCategory === "none" ? null : selectedCategory;
      if (editing) {
        await api.planning.updateShift(editing.id, {
          userId: targetUserIds[0],
          categoryId,
          startsAt,
          endsAt,
          published,
          status,
        });
        setMessage("Turno actualizado correctamente.");
      } else if (targetUserIds.length === 1) {
        await api.planning.createShift({
          userId: targetUserIds[0],
          categoryId,
          startsAt,
          endsAt,
          published,
        });
        setMessage("Turno creado correctamente.");
      } else {
        await api.planning.createManyShifts({
          userIds: targetUserIds,
          categoryId,
          startsAt,
          endsAt,
          published,
        });
        setMessage(`Turnos creados para ${targetUserIds.length} usuarios.`);
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
    Alert.alert("Eliminar turno", `Eliminar ${shift.user.fullName} ${formatDay(shift.startsAt)} ${formatRange(shift)}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => void deleteShift(shift),
      },
    ]);
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
    if (pickerTarget === "date") setDate(value);
    if (pickerTarget === "start") setStartTime(value);
    if (pickerTarget === "end") setEndTime(value);
    setPickerTarget(null);
  }

  const visibleUsers = users.filter((user) => {
    if (categoryFilter === "none") return user.categories.length === 0;
    if (typeof categoryFilter === "number") return user.categories.some((category) => category.id === categoryFilter);
    return true;
  });

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Planificar horarios</Text>
          <Text style={styles.subtitle}>Crea, edita, publica y controla solapes por usuario y categoria.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Semana {formatDay(weekStart)} - {formatDay(addDays(weekStart, 6))}</Text>
          <View style={styles.controlsRow}>
            <Pressable style={styles.secondaryButton} onPress={() => setWeekStart((current) => addDays(current, -7))}>
              <Text style={styles.secondaryButtonText}>Anterior</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setWeekStart(startOfWeek(new Date()))}>
              <Text style={styles.secondaryButtonText}>Hoy</Text>
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

          <Text style={styles.label}>Estado de publicacion</Text>
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
                <Chip label="Un usuario" selected={targetMode === "one"} onPress={() => setTargetMode("one")} />
                <Chip label={`Usuarios visibles (${visibleUsers.length})`} selected={targetMode === "visible"} onPress={() => setTargetMode("visible")} />
              </View>
            </>
          ) : null}

          {targetMode === "one" || editing ? (
            <>
              <Text style={styles.label}>Usuario asignado</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {visibleUsers.map((user) => (
                  <Chip key={user.id} label={user.fullName} selected={selectedUserId === user.id} onPress={() => setSelectedUserId(user.id)} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <Text style={styles.label}>Categoria del turno</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <Chip label="Sin categoria" selected={selectedCategory === "none"} onPress={() => setSelectedCategory("none")} />
            {categories.map((category) => (
              <Chip key={category.id} label={category.name} selected={selectedCategory === category.id} onPress={() => setSelectedCategory(category.id)} />
            ))}
          </ScrollView>

          <View style={styles.formGrid}>
            <FieldButton label="Fecha" value={formatDay(date)} onPress={() => setPickerTarget("date")} />
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
          <Text style={styles.sectionTitle}>Turnos visibles</Text>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2f5f5b" />
              <Text style={styles.muted}>Cargando planificacion...</Text>
            </View>
          ) : shifts.length ? (
            <View style={styles.daysList}>
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(weekStart, index);
                const dayShifts = shifts.filter((shift) => sameDay(shift.startsAt, day));
                return (
                  <View key={day.toISOString()} style={styles.dayGroup}>
                    <Text style={styles.dayTitle}>{formatDay(day)}</Text>
                    {dayShifts.length ? dayShifts.map((shift) => (
                      <View key={shift.id} style={styles.shiftCard}>
                        <Pressable style={styles.shiftBody} onPress={() => editShift(shift)}>
                          <View style={styles.shiftTop}>
                            <Text style={styles.shiftName}>{shift.user.fullName}</Text>
                            <Text style={[styles.badge, !shift.published && styles.badgeDraft]}>{publishedLabel(shift.published)}</Text>
                          </View>
                          <Text style={styles.shiftTime}>{formatRange(shift)} - {categoryName(shift)}</Text>
                          <Text style={styles.shiftMeta}>{statusLabel(shift.status)} - creado por {shift.createdBy.fullName}</Text>
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
                    )) : (
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
          value={pickerTarget === "date" ? date : pickerTarget === "start" ? startTime : endTime}
          mode={pickerTarget === "date" ? "date" : "time"}
          is24Hour
          onChange={onPickerChange}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>{label}</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f7f7f4",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  deniedBox: {
    gap: 8,
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
    lineHeight: 20,
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    color: "#151515",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  label: {
    color: "#6a6a64",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
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
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    maxWidth: 190,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: "#2f5f5b",
    borderColor: "#2f5f5b",
  },
  chipText: {
    color: "#2f5f5b",
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
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 62,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  fieldLabel: {
    color: "#6a6a64",
    fontSize: 12,
    fontWeight: "700",
  },
  fieldValue: {
    color: "#151515",
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    flexGrow: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  publishButton: {
    alignItems: "center",
    backgroundColor: "#d86f45",
    borderRadius: 8,
    marginTop: 14,
    minHeight: 42,
    justifyContent: "center",
  },
  publishButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.65,
  },
  loadingBox: {
    alignItems: "center",
    gap: 8,
    padding: 22,
  },
  daysList: {
    gap: 12,
  },
  dayGroup: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 10,
  },
  dayTitle: {
    color: "#151515",
    fontWeight: "700",
  },
  shiftCard: {
    backgroundColor: "#f7f7f4",
    borderColor: "#e5e5df",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  shiftBody: {
    gap: 5,
  },
  shiftTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  shiftName: {
    color: "#151515",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  shiftTime: {
    color: "#222",
    fontWeight: "700",
  },
  shiftMeta: {
    color: "#62625c",
    lineHeight: 19,
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
  shiftActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  miniButton: {
    alignItems: "center",
    borderColor: "#2f5f5b",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  miniButtonText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  dangerButton: {
    alignItems: "center",
    borderColor: "#f0b8af",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  dangerButtonText: {
    color: "#b42318",
    fontWeight: "700",
  },
  muted: {
    color: "#62625c",
    lineHeight: 20,
  },
  successText: {
    color: "#217a3f",
    marginTop: 10,
  },
  errorText: {
    color: "#b42318",
    marginTop: 10,
  },
});
