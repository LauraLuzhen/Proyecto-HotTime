import { useEffect, useMemo, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { CategoriesResponse, GeneralUserResponse, ShiftResponse } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { MonthYearPicker } from "../components/MonthYearPicker";
import { BrandBackdrop } from "../components/BrandBackdrop";
import {
  buildMonthDays,
  calendarDayNames,
  endOfDay,
  formatDateTime,
  formatLongDate,
  formatMonth,
  formatRange,
  palette,
  normalizeSearchText,
  sameMonth,
  startOfMonth,
} from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

const PAGE_SIZE = 100;
type CreateMode = "USER" | "CATEGORY";
type PickerTarget = {
  owner: "create" | "edit";
  field: "startsAt" | "endsAt";
} | null;

function dayKey(value: Date | string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPastUnpublishedShift(shift: ShiftResponse | null) {
  if (!shift) return false;
  return !shift.published && new Date(shift.endsAt).getTime() < Date.now();
}

function addHours(value: Date, hours: number) {
  const next = new Date(value);
  next.setHours(next.getHours() + hours);
  return next;
}

function formatBackendDateTime(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}

function setHoursMinutes(value: Date, hours: number, minutes = 0) {
  const next = new Date(value);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function mergeDate(base: Date, nextDate: Date) {
  return new Date(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    0
  );
}

function mergeTime(base: Date, nextTime: Date) {
  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    nextTime.getHours(),
    nextTime.getMinutes(),
    nextTime.getSeconds(),
    0
  );
}

function buildDefaultRange(baseDay: Date) {
  const start = setHoursMinutes(baseDay, 9, 0);
  const end = setHoursMinutes(baseDay, 17, 0);
  return { start, end };
}

function userName(user: GeneralUserResponse | undefined, userId: number, currentUser?: { id: number; fullName: string } | null) {
  if (user?.fullName) return user.fullName;
  if (currentUser?.id === userId) return currentUser.fullName;
  return `Usuario ${userId}`;
}

function statusColor(status: ShiftResponse["status"]) {
  switch (status) {
    case "IN_PROGRESS":
      return palette.gold;
    case "COMPLETED":
      return palette.success;
    case "MISSED":
      return palette.danger;
    default:
      return palette.accent;
  }
}

function overlaps(left: { startsAt: Date; endsAt: Date }, right: { startsAt: Date | string; endsAt: Date | string }) {
  return left.startsAt < new Date(right.endsAt) && left.endsAt > new Date(right.startsAt);
}

function userIdsForCategory(users: GeneralUserResponse[], categoryId: number | null) {
  return users
    .filter((user) => (
      categoryId === null
        ? user.categories.length === 0
        : user.categories.some((category) => category.id === categoryId)
    ))
    .map((user) => user.id);
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDetail}>{detail}</Text>
    </View>
  );
}

export function PlanSchedulesScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [users, setUsers] = useState<GeneralUserResponse[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse[]>([]);
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("USER");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [createStartsAt, setCreateStartsAt] = useState(() => buildDefaultRange(new Date()).start);
  const [createEndsAt, setCreateEndsAt] = useState(() => buildDefaultRange(new Date()).end);
  const [createPublished, setCreatePublished] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerStage, setPickerStage] = useState<"date" | "time" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [detailShift, setDetailShift] = useState<ShiftResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editShift, setEditShift] = useState<ShiftResponse | null>(null);
  const [editStartsAt, setEditStartsAt] = useState(() => buildDefaultRange(new Date()).start);
  const [editEndsAt, setEditEndsAt] = useState(() => buildDefaultRange(new Date()).end);
  const [editPublished, setEditPublished] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const usersById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user] as const));
  }, [users]);

  const usersByCategoryId = useMemo(() => {
    const groups = new Map<number, GeneralUserResponse[]>();
    categories.forEach((category) => groups.set(category.id, []));

    users.forEach((user) => {
      user.categories.forEach((category) => {
        groups.get(category.id)?.push(user);
      });
    });

    return groups;
  }, [categories, users]);

  const filteredUsers = useMemo(() => {
    const query = normalizeSearchText(searchText);
    if (!query) return users;

    return users.filter((user) => (
      normalizeSearchText(user.fullName).includes(query) ||
      normalizeSearchText(user.email).includes(query)
    ));
  }, [searchText, users]);

  const days = useMemo(() => buildMonthDays(month), [month]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, ShiftResponse[]>();

    for (const shift of shifts) {
      const key = dayKey(shift.startsAt);
      const bucket = map.get(key);

      if (bucket) {
        bucket.push(shift);
      } else {
        map.set(key, [shift]);
      }
    }

    return map;
  }, [shifts]);

  const selectedShifts = shiftsByDay.get(dayKey(selectedDay)) ?? [];

  const publishableDayShifts = useMemo(() => {
    return selectedShifts.filter((shift) => !shift.published && !isPastUnpublishedShift(shift));
  }, [selectedShifts]);

  const monthSummary = useMemo(() => {
    const daysWithShifts = new Set<string>();

    for (const shift of shifts) {
      daysWithShifts.add(dayKey(shift.startsAt));
    }

    return {
      totalShifts: shifts.length,
      daysWithShifts: daysWithShifts.size,
    };
  }, [shifts]);

  const dayUnpublishedCount = useMemo(() => {
    return publishableDayShifts.length;
  }, [publishableDayShifts]);

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category] as const));
  }, [categories]);

  const assignedUserIds = useMemo(() => {
    if (createMode === "USER") {
      return selectedUserId ? [selectedUserId] : [];
    }

    if (selectedCategoryId === null) {
      return [];
    }

    return userIdsForCategory(users, selectedCategoryId);
  }, [createMode, selectedCategoryId, selectedUserId, users]);

  const assignedUsers = useMemo(() => {
    return assignedUserIds
      .map((userId) => usersById.get(userId))
      .filter((user): user is GeneralUserResponse => Boolean(user));
  }, [assignedUserIds, usersById]);

  const assignedLabel = useMemo(() => {
    if (createMode === "USER") {
      if (!selectedUserId) return "Sin usuario";
      return usersById.get(selectedUserId)?.fullName ?? `Usuario ${selectedUserId}`;
    }

    if (selectedCategoryId === null) return "Sin categoría";
    const category = categoriesById.get(selectedCategoryId);
    const count = userIdsForCategory(users, selectedCategoryId).length;
    return category ? `${category.name} (${count} usuarios)` : `Categoría #${selectedCategoryId}`;
  }, [categoriesById, createMode, selectedCategoryId, selectedUserId, users, usersById]);

  const overlapUsers = useMemo(() => {
    const activeIds = new Set(assignedUserIds);
    const conflictingIds = new Set<number>();

    if (createEndsAt <= createStartsAt || activeIds.size === 0) {
      return [];
    }

    for (const shift of shifts) {
      if (!activeIds.has(shift.userId)) continue;
      if (overlaps({ startsAt: createStartsAt, endsAt: createEndsAt }, shift)) {
        conflictingIds.add(shift.userId);
      }
    }

    return [...conflictingIds]
      .map((userId) => usersById.get(userId))
      .filter((user): user is GeneralUserResponse => Boolean(user));
  }, [assignedUserIds, createEndsAt, createStartsAt, shifts, usersById]);

  const createValidationError = useMemo(() => {
    if (!createOpen) return null;
    if (createEndsAt <= createStartsAt) return "La salida debe ser posterior a la entrada.";
    if (createMode === "USER") {
      if (!selectedUserId) return "Selecciona un usuario.";
    } else if (selectedCategoryId === null) {
      return "Selecciona una categoría.";
    }
    if (overlapUsers.length > 0) {
      const names = overlapUsers.map((user) => user.fullName).join(", ");
      return `Solapa con turno existente en: ${names}.`;
    }
    return null;
  }, [createEndsAt, createMode, createOpen, createStartsAt, overlapUsers.length, overlapUsers, selectedCategoryId, selectedUserId]);

  const editValidationError = useMemo(() => {
    if (!editOpen) return null;
    if (!editShift) return "No se ha seleccionado un turno.";
    if (editEndsAt <= editStartsAt) return "La salida debe ser posterior a la entrada.";

    const conflict = shifts.find((shift) => (
      shift.id !== editShift.id &&
      shift.userId === editShift.userId &&
      overlaps({ startsAt: editStartsAt, endsAt: editEndsAt }, shift)
    ));

    if (conflict) {
      return "Solapa con otro turno del mismo usuario.";
    }

    return null;
  }, [editEndsAt, editOpen, editShift, editStartsAt, shifts]);

  async function loadMonth(targetMonth = month) {
    setLoading(true);
    setError(null);

    try {
      const start = startOfMonth(targetMonth);
      const end = endOfDay(new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0));

      const [usersResult, categoriesResult, firstPage] = await Promise.all([
        api.user.getUsersAll(),
        api.category.getCategories(),
        api.planning.getShifts({
          startsFrom: start,
          startsTo: end,
        }),
      ]);

      let allShifts = [...firstPage.shifts];
      let offset = firstPage.shifts.length;

      while (offset < firstPage.total) {
        const page = await api.planning.getShifts({
          startsFrom: start,
          startsTo: end,
          limit: PAGE_SIZE,
          offset,
        });

        if (!page.shifts.length) break;

        allShifts = allShifts.concat(page.shifts);
        offset += page.shifts.length;
      }

      setUsers(usersResult);
      setCategories(categoriesResult);
      setShifts(allShifts);
    } catch (err) {
      const e = err as ApiClientError;
      setUsers([]);
      setCategories([]);
      setShifts([]);
      setError(e.message ?? "No se pudo cargar la planificacion.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMonth(month);
  }, [month]);

  useRefreshOnFocus(() => {
    void loadMonth(month);
  }, [month]);

  function goToMonth(nextMonth: Date) {
    const normalized = startOfMonth(nextMonth);
    setMonth(normalized);
    setSelectedDay(normalized);
    setMonthPickerOpen(false);
  }

  function goToToday() {
    const today = new Date();
    setMonth(startOfMonth(today));
    setSelectedDay(today);
  }

  function openCreateModal() {
    const defaults = buildDefaultRange(selectedDay);
    setCreateStartsAt(defaults.start);
    setCreateEndsAt(defaults.end);
    setCreatePublished(false);
    setCreateMode("USER");
    setSelectedUserId(users[0]?.id ?? null);
    setSelectedCategoryId(categories[0]?.id ?? null);
    setSearchText("");
    setSubmitError(null);
    setPickerTarget(null);
    setPickerStage(null);
    setCreateOpen(true);
  }

  function openDetailModal(shift: ShiftResponse) {
    setDetailShift(shift);
  }

  function closeDetailModal() {
    setDetailShift(null);
  }

  function openEditModal(shift: ShiftResponse) {
    setEditShift(shift);
    setEditStartsAt(new Date(shift.startsAt));
    setEditEndsAt(new Date(shift.endsAt));
    setEditPublished(shift.published);
    setEditError(null);
    setPickerTarget(null);
    setPickerStage(null);
    setEditOpen(true);
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditShift(null);
    setEditError(null);
    setPickerTarget(null);
    setPickerStage(null);
  }

  function resetCreateModal() {
    setCreateOpen(false);
    setCreateMode("USER");
    setSelectedUserId(null);
    setSelectedCategoryId(null);
    setCreateStartsAt(buildDefaultRange(selectedDay).start);
    setCreateEndsAt(buildDefaultRange(selectedDay).end);
    setCreatePublished(false);
    setPickerTarget(null);
    setPickerStage(null);
    setSubmitError(null);
    setSearchText("");
  }

  function selectUser(userId: number) {
    setSelectedUserId(userId);
  }

  function selectCategory(categoryId: number | null) {
    setSelectedCategoryId(categoryId);
  }

  function onPickerChange(event: DateTimePickerEvent, value?: Date) {
    if (event?.type === "dismissed" || !value) {
      setPickerTarget(null);
      setPickerStage(null);
      return;
    }

    if (!pickerTarget) {
      setPickerStage(null);
      return;
    }

    const isDateStage = pickerStage !== "time";

    if (pickerTarget.owner === "create") {
      if (pickerTarget.field === "startsAt") {
        setCreateStartsAt((current) => (isDateStage ? mergeDate(current, value) : mergeTime(current, value)));
        if (isDateStage) {
          setPickerStage("time");
          return;
        }
        if (createEndsAt <= value) {
          setCreateEndsAt(addHours(value, 8));
        }
      }

      if (pickerTarget.field === "endsAt") {
        setCreateEndsAt((current) => (isDateStage ? mergeDate(current, value) : mergeTime(current, value)));
        if (isDateStage) {
          setPickerStage("time");
          return;
        }
      }
    } else if (pickerTarget.owner === "edit") {
      if (pickerTarget.field === "startsAt") {
        setEditStartsAt((current) => (isDateStage ? mergeDate(current, value) : mergeTime(current, value)));
        if (isDateStage) {
          setPickerStage("time");
          return;
        }
        if (editEndsAt <= value) {
          setEditEndsAt(addHours(value, 8));
        }
      }

      if (pickerTarget.field === "endsAt") {
        setEditEndsAt((current) => (isDateStage ? mergeDate(current, value) : mergeTime(current, value)));
        if (isDateStage) {
          setPickerStage("time");
          return;
        }
      }
    }

    setPickerTarget(null);
    setPickerStage(null);
    setSubmitError(null);
    setEditError(null);
  }

  async function submitCreateShift() {
    if (createValidationError) {
      setSubmitError(createValidationError);
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      if (createMode === "USER") {
        await api.planning.createShiftForUser({
          startsAt: formatBackendDateTime(createStartsAt) as unknown as Date,
          endsAt: formatBackendDateTime(createEndsAt) as unknown as Date,
          published: createPublished,
          userId: selectedUserId!,
        });
      } else {
        await api.planning.createShiftForCategory({
          startsAt: formatBackendDateTime(createStartsAt) as unknown as Date,
          endsAt: formatBackendDateTime(createEndsAt) as unknown as Date,
          published: createPublished,
          categoryId: selectedCategoryId ?? null,
        });
      }

      resetCreateModal();
      await loadMonth(month);
    } catch (err) {
      const e = err as ApiClientError;
      if (e.code === "SHIFT_OVERLAP" || e.status === 409) {
        setSubmitError(e.message ?? "El turno solapa con otro existente.");
      } else {
        setSubmitError(e.message ?? "No se pudo crear el turno.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function submitUpdateShift() {
    if (!editShift) return;
    if (editValidationError) {
      setEditError(editValidationError);
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      await api.planning.updateShift(editShift.id, {
        startsAt: formatBackendDateTime(editStartsAt) as unknown as Date,
        endsAt: formatBackendDateTime(editEndsAt) as unknown as Date,
        published: isPastUnpublishedShift(editShift) ? false : editPublished,
      });
      closeEditModal();
      await loadMonth(month);
    } catch (err) {
      const e = err as ApiClientError;
      setEditError(e.message ?? "No se pudo actualizar el turno.");
    } finally {
      setEditSaving(false);
    }
  }

  function confirmDeleteShift(shift: ShiftResponse) {
    Alert.alert("Eliminar turno", "Seguro que quieres eliminar este turno?", [
      { text: "No", style: "cancel" },
      {
        text: "Sí",
        style: "destructive",
        onPress: () => {
          void deleteShift(shift);
        },
      },
    ]);
  }

  async function deleteShift(shift: ShiftResponse) {
    setEditSaving(true);
    setEditError(null);

    try {
      await api.planning.deleteShift(shift.id);
      closeDetailModal();
      closeEditModal();
      await loadMonth(month);
    } catch (err) {
      const e = err as ApiClientError;
      setEditError(e.message ?? "No se pudo eliminar el turno.");
    } finally {
      setEditSaving(false);
    }
  }

  async function publishDayShifts() {
    const targets = publishableDayShifts;
    if (targets.length === 0) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await Promise.all(targets.map((shift) => api.planning.updateShift(shift.id, { published: true })));
      await loadMonth(month);
    } catch (err) {
      const e = err as ApiClientError;
      setSubmitError(e.message ?? "No se pudo publicar el día.");
    } finally {
      setSaving(false);
    }
  }

  function renderDayPreview(day: Date, selected: boolean) {
    const items = shiftsByDay.get(dayKey(day)) ?? [];

    if (!items.length) {
      return <Text style={[styles.dayHint, selected && styles.dayHintSelected]}>Libre</Text>;
    }

    return (
      <View style={styles.dayPreviewRow}>
        {items.slice(0, 3).map((shift) => (
          <View key={shift.id} style={[styles.dayPreviewDot, { backgroundColor: statusColor(shift.status) }]} />
        ))}
        {items.length > 3 ? <Text style={styles.dayMore}>+{items.length - 3}</Text> : null}
      </View>
    );
  }

  if (!auth.user || (auth.user.role !== "ADMIN" && auth.user.role !== "MANAGER")) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.deniedBox}>
          <Text style={styles.heroTitle}>Acceso denegado</Text>
          <Text style={styles.muted}>Esta vista solo está disponible para administradores y managers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BrandBackdrop />
      <View style={styles.screen}>
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
                <Text style={styles.muted}>Cargando planificación...</Text>
              </View>
            ) : (
              <>
                <View style={styles.weekRow}>
                  {calendarDayNames.map((day) => (
                    <Text key={day} style={styles.weekLabel}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {days.map((day) => {
                    const inMonth = sameMonth(day, month);
                    const selected = dayKey(day) === dayKey(selectedDay);

                    return (
                      <Pressable
                        key={day.toISOString()}
                        style={[
                          styles.dayCell,
                          !inMonth && styles.dayCellMuted,
                          selected && styles.dayCellSelected,
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text
                          style={[
                            styles.dayNumber,
                            !inMonth && styles.dayNumberMuted,
                            selected && styles.dayNumberSelected,
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                        {renderDayPreview(day, selected)}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.panel}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Turnos del {formatLongDate(selectedDay)}</Text>
              <View style={styles.sectionActions}>
                <Text style={styles.sectionHint}>{selectedShifts.length} turno(s)</Text>
                <Pressable
                  disabled={dayUnpublishedCount === 0 || saving}
                  style={[
                    styles.publishDayButton,
                    (dayUnpublishedCount === 0 || saving) && styles.publishDayButtonDisabled,
                  ]}
                  onPress={() => void publishDayShifts()}
                >
                  <Text
                    style={[
                      styles.publishDayButtonText,
                      (dayUnpublishedCount === 0 || saving) && styles.publishDayButtonTextDisabled,
                    ]}
                  >
                    Publicar {dayUnpublishedCount}
                  </Text>
                </Pressable>
              </View>
            </View>

            {selectedShifts.length ? (
              <View style={styles.shiftList}>
                {selectedShifts.map((shift) => {
                  const user = usersById.get(shift.userId);
                  const name = userName(user, shift.userId, auth.user);

                  return (
                    <Pressable key={shift.id} style={styles.shiftCard} onPress={() => openDetailModal(shift)}>
                      <View style={styles.shiftHeader}>
                        <View style={styles.shiftIdentity}>
                          <Text style={styles.shiftUser}>{name}</Text>
                          <Text style={styles.shiftMeta}>
                            Turno #{shift.id} · {shift.status}
                          </Text>
                        </View>
                        <Text style={[styles.statusChip, { backgroundColor: shift.published ? palette.accent : palette.gold }]}>
                          {shift.published ? "Publicado" : "Borrador"}
                        </Text>
                      </View>
                      <View style={styles.shiftRow}>
                        <Text style={styles.shiftLabel}>Horario</Text>
                        <Text style={styles.shiftValue}>{formatRange(shift)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <EmptyState title="No hay turnos" detail="No hay turnos para este día." />
            )}
          </View>
        </ScrollView>

        <Pressable style={styles.fab} onPress={openCreateModal}>
          <Text style={styles.fabText}>+ Crear turno</Text>
        </Pressable>
      </View>

      <Modal animationType="slide" transparent visible={createOpen} onRequestClose={resetCreateModal}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={resetCreateModal} />
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleGroup}>
                  <Text style={styles.sheetTitle}>Crear turno</Text>
                  <Text style={styles.sheetSubtitle}>Previsualiza el turno antes de guardarlo.</Text>
                </View>
                <Pressable style={styles.closeButton} onPress={resetCreateModal}>
                  <MaterialIcons name="close" size={18} color={palette.text} />
                </Pressable>
              </View>

              <View style={styles.panelSoft}>
                <Text style={styles.sectionTitle}>Horario</Text>

                <View style={styles.formRow}>
                  <FieldButton
                    label="Inicio"
                    value={formatDateTime(createStartsAt)}
                    onPress={() => {
                      setPickerTarget({ owner: "create", field: "startsAt" });
                      setPickerStage("date");
                    }}
                  />
                  <FieldButton
                    label="Fin"
                    value={formatDateTime(createEndsAt)}
                    onPress={() => {
                      setPickerTarget({ owner: "create", field: "endsAt" });
                      setPickerStage("date");
                    }}
                  />
                </View>

                <Pressable
                  style={[styles.publishToggle, createPublished && styles.publishToggleActive]}
                  onPress={() => setCreatePublished((current) => !current)}
                >
                  <Text style={[styles.publishToggleText, createPublished && styles.publishToggleTextActive]}>
                    {createPublished ? "Publicado" : "Borrador"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.panelSoft}>
                <Text style={styles.sectionTitle}>Asignación</Text>

                <View style={styles.segmentRow}>
                  <Pressable
                    style={[styles.segmentButton, createMode === "USER" && styles.segmentButtonActive]}
                    onPress={() => setCreateMode("USER")}
                  >
                    <Text style={[styles.segmentText, createMode === "USER" && styles.segmentTextActive]}>Un usuario</Text>
                  </Pressable>


                  <Pressable
                    style={[styles.segmentButton, createMode === "CATEGORY" && styles.segmentButtonActive]}
                    onPress={() => setCreateMode("CATEGORY")}
                  >
                    <Text style={[styles.segmentText, createMode === "CATEGORY" && styles.segmentTextActive]}>Por categoria</Text>
                  </Pressable>
                </View>

                {createMode === "USER" ? (
                  <View style={styles.selectorBlock}>
                    <TextInput
                      autoCapitalize="none"
                      onChangeText={setSearchText}
                      placeholder="Buscar por nombre o email"
                      style={styles.input}
                      value={searchText}
                    />
                    <Text style={styles.selectionCount}>Usuario seleccionado</Text>

                    {filteredUsers.length === 0 ? (
                      <EmptyState title="Sin resultados" detail="Prueba otro nombre o email." />
                    ) : (
                      <View style={styles.list}>
                        {filteredUsers.map((user) => {
                          const selected = selectedUserId === user.id;
                          const categoriesLabel = user.categories.length
                            ? user.categories.map((category) => category.name).join(", ")
                            : "Sin categoría";

                          return (
                            <Pressable
                              key={user.id}
                              style={[styles.row, selected && styles.rowSelected]}
                              onPress={() => selectUser(user.id)}
                            >
                              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                                <MaterialIcons
                                  name={selected ? "check" : "radio-button-unchecked"}
                                  size={16}
                                  color={selected ? "#fff" : palette.muted}
                                />
                              </View>
                              <View style={styles.rowText}>
                                <Text style={styles.rowTitle} numberOfLines={1}>{user.fullName}</Text>
                                <Text style={styles.rowDetail} numberOfLines={1}>{user.email}</Text>
                                <Text style={styles.rowDetail} numberOfLines={1}>{categoriesLabel}</Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.selectorBlock}>
                    <Text style={styles.selectionCount}>
                      {selectedCategoryId === null
                        ? "Selecciona una categoría"
                        : `${usersByCategoryId.get(selectedCategoryId)?.length ?? 0} usuario(s) en la categoría`}
                    </Text>

                    <View style={styles.list}>
                      {categories.map((category) => {
                        const count = usersByCategoryId.get(category.id)?.length ?? 0;
                        const selected = selectedCategoryId === category.id;

                        return (
                          <Pressable
                            key={category.id}
                            style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                            onPress={() => selectCategory(category.id)}
                          >
                            <View style={styles.categoryMeta}>
                              <Text style={styles.rowTitle}>{category.name}</Text>
                              <Text style={styles.rowDetail}>{count} usuario(s)</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.panelSoft}>
                <Text style={styles.sectionTitle}>Vista previa</Text>
                <Text style={styles.previewRow}>Horario: {formatDateTime(createStartsAt)} - {formatDateTime(createEndsAt)}</Text>
                <Text style={styles.previewRow}>Estado: {createPublished ? "Publicado" : "Borrador"}</Text>
                <Text style={styles.previewRow}>Usuarios asignados: {assignedUsers.length}</Text>
                <Text style={styles.previewRow}>Asignación: {assignedLabel}</Text>
              </View>

              {pickerTarget?.owner === "create" ? (
                <View style={styles.panelSoft}>
                  <Text style={styles.sectionTitle}>Elegir fecha y hora</Text>
                  <DateTimePicker
                    mode={pickerStage ?? "date"}
                    is24Hour
                    value={pickerTarget.field === "startsAt" ? createStartsAt : createEndsAt}
                    onChange={onPickerChange}
                  />
                </View>
              ) : null}

              {submitError || createValidationError ? (
                <Text style={styles.formError}>{submitError ?? createValidationError}</Text>
              ) : null}

              <Pressable
                disabled={saving}
                style={[styles.submitButton, saving && styles.buttonDisabled]}
                onPress={() => void submitCreateShift()}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Crear turno</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={detailShift !== null} onRequestClose={closeDetailModal}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDetailModal} />
          <View style={styles.sheet}>
            {detailShift ? (
              <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetTitleGroup}>
                    <Text style={styles.sheetTitle}>{userName(usersById.get(detailShift.userId), detailShift.userId, auth.user)}</Text>
                    <Text style={styles.sheetSubtitle}>Vista previa completa del turno #{detailShift.id}</Text>
                  </View>
                  <Pressable style={styles.closeButton} onPress={closeDetailModal}>
                    <MaterialIcons name="close" size={18} color={palette.text} />
                  </Pressable>
                </View>

                <View style={styles.panelSoft}>
                  <Text style={styles.sectionTitle}>Información</Text>
                  <DetailRow label="Usuario" value={userName(usersById.get(detailShift.userId), detailShift.userId, auth.user)} />
                  <DetailRow label="Turno ID" value={`#${detailShift.id}`} />
                  <DetailRow label="Organización" value={String(detailShift.organizationId)} />
                  <DetailRow label="Creado por" value={String(detailShift.createdById)} />
                  <DetailRow label="Estado" value={detailShift.status} />
                  <DetailRow label="Publicado" value={detailShift.published ? "Sí" : "No"} />
                  <DetailRow label="Entrada" value={formatDateTime(detailShift.startsAt)} />
                  <DetailRow label="Salida" value={formatDateTime(detailShift.endsAt)} />
                  <DetailRow label="Horario" value={formatRange(detailShift)} />
                  <DetailRow label="Entrada real" value={detailShift.actualStartsAt ? formatDateTime(detailShift.actualStartsAt) : "Sin registrar"} />
                  <DetailRow label="Salida real" value={detailShift.actualEndsAt ? formatDateTime(detailShift.actualEndsAt) : "Sin registrar"} />
                  <DetailRow
                    label="Categorías"
                    value={
                      detailShift.categories.length
                        ? detailShift.categories.map((relation) => (
                            categories.find((category) => category.id === relation.categoryId)?.name ?? `#${relation.categoryId}`
                          )).join(", ")
                        : "Sin categorías"
                    }
                  />
                  <DetailRow label="Creado" value={formatDateTime(detailShift.createdAt)} />
                  <DetailRow label="Actualizado" value={formatDateTime(detailShift.updatedAt)} />
                </View>

                {detailShift ? (
                  <View style={styles.actionRow}>
                    {!isPastUnpublishedShift(detailShift) ? (
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => {
                          const shift = detailShift;
                          if (!shift) return;
                          closeDetailModal();
                          openEditModal(shift);
                        }}
                      >
                        <Text style={styles.secondaryButtonText}>Update</Text>
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.dangerButton} onPress={() => confirmDeleteShift(detailShift)}>
                      <Text style={styles.dangerButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={editOpen} onRequestClose={closeEditModal}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeEditModal} />
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleGroup}>
                  <Text style={styles.sheetTitle}>Update turno</Text>
                  <Text style={styles.sheetSubtitle}>
                    Cambia horario y publicación con el mismo formato que el backend espera.
                  </Text>
                </View>
                <Pressable style={styles.closeButton} onPress={closeEditModal}>
                  <MaterialIcons name="close" size={18} color={palette.text} />
                </Pressable>
              </View>

              <View style={styles.panelSoft}>
                <Text style={styles.sectionTitle}>Horario</Text>

                <View style={styles.formRow}>
                  <FieldButton
                    label="StartsAt"
                    value={formatDateTime(editStartsAt)}
                    onPress={() => {
                      setPickerTarget({ owner: "edit", field: "startsAt" });
                      setPickerStage("date");
                    }}
                  />
                  <FieldButton
                    label="EndsAt"
                    value={formatDateTime(editEndsAt)}
                    onPress={() => {
                      setPickerTarget({ owner: "edit", field: "endsAt" });
                      setPickerStage("date");
                    }}
                  />
                </View>

                <Pressable
                  disabled={isPastUnpublishedShift(editShift)}
                  style={[
                    styles.publishToggle,
                    editPublished && styles.publishToggleActive,
                    isPastUnpublishedShift(editShift) && styles.publishToggleDisabled,
                  ]}
                  onPress={() => {
                    if (isPastUnpublishedShift(editShift)) return;
                    setEditPublished((current) => !current);
                  }}
                >
                  <Text style={[styles.publishToggleText, editPublished && styles.publishToggleTextActive]}>
                    {editPublished ? "Publicado" : "Borrador"}
                  </Text>
                </Pressable>
              </View>

              {pickerTarget?.owner === "edit" ? (
                <View style={styles.panelSoft}>
                  <Text style={styles.sectionTitle}>Elegir fecha y hora</Text>
                  <DateTimePicker
                    mode={pickerStage ?? "date"}
                    is24Hour
                    value={pickerTarget.field === "startsAt" ? editStartsAt : editEndsAt}
                    onChange={onPickerChange}
                  />
                </View>
              ) : null}

              {editError || editValidationError ? (
                <Text style={styles.formError}>{editError ?? editValidationError}</Text>
              ) : null}

              <View style={styles.actionRow}>
                <Pressable
                  disabled={editSaving}
                  style={[styles.submitButton, editSaving && styles.buttonDisabled]}
                  onPress={() => void submitUpdateShift()}
                >
                  {editSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Guardar update</Text>}
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => editShift ? confirmDeleteShift(editShift) : null}
                >
                  <Text style={styles.secondaryButtonText}>Delete</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

function FieldButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.fieldButton} onPress={onPress}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#eef3ff",
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 110,
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
  heroTitle: {
    color: palette.text,
    fontSize: 26,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  panelSoft: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  headerCenter: {
    flex: 1,
    gap: 8,
    marginHorizontal: 8,
  },
  selectorButton: {
    alignItems: "center",
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  selectorLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  selectorValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  navButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    minWidth: 82,
    paddingHorizontal: 12,
  },
  navButtonText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quickButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  quickButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  quickStat: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  quickStatValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  quickStatLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  loadingBox: {
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  weekRow: {
    flexDirection: "row",
    marginTop: 14,
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
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  dayHintSelected: {
    color: "#e7f4f1",
  },
  dayPreviewRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    justifyContent: "center",
    marginTop: 4,
  },
  dayPreviewDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dayMore: {
    color: palette.muted,
    fontSize: 9,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  sectionHint: {
    color: palette.muted,
    fontSize: 12,
  },
  publishDayButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderColor: palette.accent,
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  publishDayButtonDisabled: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    opacity: 1,
  },
  publishDayButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  publishDayButtonTextDisabled: {
    color: palette.muted,
  },
  shiftList: {
    gap: 10,
  },
  shiftCard: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  shiftHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  shiftIdentity: {
    flex: 1,
    gap: 4,
  },
  shiftUser: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  shiftMeta: {
    color: palette.muted,
    fontSize: 12,
  },
  statusChip: {
    borderRadius: 999,
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shiftRow: {
    gap: 4,
  },
  shiftLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  shiftValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700",
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  emptyStateTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyStateDetail: {
    color: palette.muted,
    textAlign: "center",
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
  deniedBox: {
    gap: 8,
    padding: 16,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.38)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    maxHeight: "78%",
    padding: 16,
    width: "100%",
  },
  modalTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  fab: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 999,
    bottom: 18,
    elevation: 6,
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: 18,
    position: "absolute",
    right: 16,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: {
    color: "#fff",
    fontWeight: "800",
  },
  sheetOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.38)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: palette.surfaceElevated,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "92%",
    paddingTop: 8,
  },
  sheetContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  sheetHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sheetTitleGroup: {
    flex: 1,
    gap: 4,
  },
  sheetTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: palette.muted,
    lineHeight: 20,
  },
  closeButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeButtonText: {
    color: palette.text,
    fontWeight: "700",
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
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
    backgroundColor: "#fff",
  },
  fieldLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  fieldValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
  },
  publishToggle: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  publishToggleActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  publishToggleDisabled: {
    opacity: 0.55,
  },
  publishToggleText: {
    color: palette.accent,
    fontWeight: "800",
  },
  publishToggleTextActive: {
    color: "#fff",
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  segmentButtonActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  segmentText: {
    color: palette.accent,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#fff",
  },
  selectorBlock: {
    gap: 10,
  },
  selectionCount: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    gap: 8,
  },
  row: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  rowSelected: {
    backgroundColor: "#f7f8ff",
    borderColor: palette.accent,
  },
  categoryRow: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  categoryRowSelected: {
    backgroundColor: "#f7f8ff",
    borderColor: palette.accent,
  },
  categoryMeta: {
    flex: 1,
    minWidth: 0,
  },
  categoryBadge: {
    color: palette.accent,
    fontWeight: "800",
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#d7ddff",
    borderRadius: 6,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  checkboxSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  checkboxText: {
    color: palette.accent,
    fontWeight: "700",
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rowDetail: {
    color: palette.muted,
    fontSize: 13,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  monthChip: {
    alignItems: "center",
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
    width: "31.5%",
  },
  monthChipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  monthChipText: {
    color: palette.text,
    fontWeight: "800",
    textAlign: "center",
  },
  monthChipTextSelected: {
    color: "#fff",
  },
  yearList: {
    gap: 8,
  },
  yearRow: {
    alignItems: "center",
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  yearRowSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  yearRowText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
  },
  yearRowTextSelected: {
    color: "#fff",
  },
  input: {
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    color: palette.text,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff",
  },
  formError: {
    color: palette.danger,
    fontWeight: "700",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: 13,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  previewRow: {
    color: palette.text,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    color: palette.accent,
    fontWeight: "800",
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#b42318",
    borderRadius: 14,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  dangerButtonText: {
    color: "#fff",
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
});













