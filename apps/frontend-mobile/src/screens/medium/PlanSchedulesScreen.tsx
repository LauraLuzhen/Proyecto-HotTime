import { useEffect, useMemo, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
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

import { useAppAlert } from "../../components/AppAlert";
import { CalendarPanel } from "../../components/CalendarPanel";
import { ScreenEmptyState } from "../../components/ScreenEmptyState";
import { ScreenFieldButton } from "../../components/ScreenFieldButton";
import { ApiClientError, createApi } from "../../lib/api";
import { MonthYearPicker } from "../../components/MonthYearPicker";
import { BrandBackdrop } from "../../components/BrandBackdrop";
import { planSchedulesStyles as styles, screenSharedStyles as calendarDayStyles } from "../../lib/mobileStyles";
import {
  buildMonthDays,
  calendarDayNames,
  addHours,
  endOfDay,
  formatDateTime,
  formatLongDate,
  formatMonth,
  formatRange,
  formatBackendDateTime,
  buildDefaultRange,
  dayKey,
  mergeDate,
  mergeTime,
  palette,
  normalizeSearchText,
  shiftOverlaps,
  startOfMonth,
} from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";
import { tokenStorage } from "../../state/auth/storage";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";

const PAGE_SIZE = 100;
type CreateMode = "USER" | "CATEGORY";
type PickerTarget = {
  owner: "create" | "edit";
  field: "startsAt" | "endsAt";
} | null;

function isPastUnpublishedShift(shift: ShiftResponse | null) {
  if (!shift) return false;
  return !shift.published && new Date(shift.endsAt).getTime() < Date.now();
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

function userIdsForCategory(users: GeneralUserResponse[], categoryId: number | null) {
  return users
    .filter((user) => (
      categoryId === null
        ? user.categories.length === 0
        : user.categories.some((category) => category.id === categoryId)
    ))
    .map((user) => user.id);
}

export function PlanSchedulesScreen() {
  const auth = useAuth();
  const appAlert = useAppAlert();
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
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
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
      return selectedUserIds;
    }

    if (selectedCategoryId === null) {
      return [];
    }

    return userIdsForCategory(users, selectedCategoryId);
  }, [createMode, selectedCategoryId, selectedUserIds, users]);

  const assignedUsers = useMemo(() => {
    return assignedUserIds
      .map((userId) => usersById.get(userId))
      .filter((user): user is GeneralUserResponse => Boolean(user));
  }, [assignedUserIds, usersById]);

  const assignedLabel = useMemo(() => {
    if (createMode === "USER") {
      if (selectedUserIds.length === 0) return "Sin usuarios";
      if (selectedUserIds.length === 1) {
        const userId = selectedUserIds[0];
        return usersById.get(userId)?.fullName ?? `Usuario ${userId}`;
      }
      return `${selectedUserIds.length} usuarios seleccionados`;
    }

    if (selectedCategoryId === null) return "Sin categoría";
    const category = categoriesById.get(selectedCategoryId);
    const count = userIdsForCategory(users, selectedCategoryId).length;
    return category ? `${category.name} (${count} usuarios)` : `Categoría #${selectedCategoryId}`;
  }, [categoriesById, createMode, selectedCategoryId, selectedUserIds, users, usersById]);

  const overlapUsers = useMemo(() => {
    const activeIds = new Set(assignedUserIds);
    const conflictingIds = new Set<number>();

    if (createEndsAt <= createStartsAt || activeIds.size === 0) {
      return [];
    }

    for (const shift of shifts) {
      if (!activeIds.has(shift.userId)) continue;
      if (shiftOverlaps({ startsAt: createStartsAt, endsAt: createEndsAt }, shift)) {
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
      if (selectedUserIds.length === 0) return "Selecciona al menos un usuario.";
    } else if (selectedCategoryId === null) {
      return "Selecciona una categoría.";
    } else if ((usersByCategoryId.get(selectedCategoryId)?.length ?? 0) === 0) {
      return "La categoría seleccionada no tiene usuarios.";
    }
    if (overlapUsers.length > 0) {
      const names = overlapUsers.map((user) => user.fullName).join(", ");
      return `Solapa con turno existente en: ${names}.`;
    }
    return null;
  }, [createEndsAt, createMode, createOpen, createStartsAt, overlapUsers.length, overlapUsers, selectedCategoryId, selectedUserIds, usersByCategoryId]);

  const editValidationError = useMemo(() => {
    if (!editOpen) return null;
    if (!editShift) return "No se ha seleccionado un turno.";
    if (editEndsAt <= editStartsAt) return "La salida debe ser posterior a la entrada.";

    const conflict = shifts.find((shift) => (
      shift.id !== editShift.id &&
      shift.userId === editShift.userId &&
      shiftOverlaps({ startsAt: editStartsAt, endsAt: editEndsAt }, shift)
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
    setSelectedUserIds(users[0]?.id ? [users[0].id] : []);
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
    setSelectedUserIds([]);
    setSelectedCategoryId(null);
    setCreateStartsAt(buildDefaultRange(selectedDay).start);
    setCreateEndsAt(buildDefaultRange(selectedDay).end);
    setCreatePublished(false);
    setPickerTarget(null);
    setPickerStage(null);
    setSubmitError(null);
    setSearchText("");
  }

  function toggleUser(userId: number) {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
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
        await api.planning.createShiftForUsers({
          startsAt: formatBackendDateTime(createStartsAt) as unknown as Date,
          endsAt: formatBackendDateTime(createEndsAt) as unknown as Date,
          published: createPublished,
          userIds: selectedUserIds,
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
    appAlert.showAlert({
      title: "Eliminar turno",
      message: "¿Seguro que quieres eliminar este turno?",
      buttons: [
        { text: "No", style: "cancel" },
        {
          text: "Sí, eliminar",
          style: "destructive",
          onPress: () => {
            void deleteShift(shift);
          },
        },
      ],
    });
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

  function renderDayPreview(items: ShiftResponse[], selected: boolean) {
    if (!items.length) {
      return <Text style={[calendarDayStyles.calendarDayHint, selected && calendarDayStyles.calendarDayHintSelected]}>Libre</Text>;
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
          <CalendarPanel
            days={days}
            error={error}
            loading={loading}
            loadingLabel="Cargando planificación..."
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
              const items = shiftsByDay.get(dayKey(day)) ?? [];

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
                  {renderDayPreview(items, meta.selected)}
                </Pressable>
              );
            }}
          />

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
              <ScreenEmptyState title="No hay turnos" detail="No hay turnos para este día." />
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
                  <ScreenFieldButton
                    label="Inicio"
                    value={formatDateTime(createStartsAt)}
                    onPress={() => {
                      setPickerTarget({ owner: "create", field: "startsAt" });
                      setPickerStage("date");
                    }}
                  />
                  <ScreenFieldButton
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
                    onPress={() => {
                      setCreateMode("USER");
                      setSubmitError(null);
                    }}
                  >
                    <Text style={[styles.segmentText, createMode === "USER" && styles.segmentTextActive]}>Por usuario</Text>
                  </Pressable>


                  <Pressable
                    style={[styles.segmentButton, createMode === "CATEGORY" && styles.segmentButtonActive]}
                    onPress={() => {
                      setCreateMode("CATEGORY");
                      setSubmitError(null);
                    }}
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
                    <Text style={styles.selectionCount}>{selectedUserIds.length} usuario(s) seleccionados</Text>

                    {filteredUsers.length === 0 ? (
                      <ScreenEmptyState title="Sin resultados" detail="Prueba otro nombre o email." />
                    ) : (
                      <View style={styles.list}>
                        {filteredUsers.map((user) => {
                          const selected = selectedUserIds.includes(user.id);
                          const categoriesLabel = user.categories.length
                            ? user.categories.map((category) => category.name).join(", ")
                            : "Sin categoría";

                          return (
                            <Pressable
                              key={user.id}
                              style={[styles.row, selected && styles.rowSelected]}
                              onPress={() => toggleUser(user.id)}
                            >
                              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                                <MaterialIcons
                                  name={selected ? "check" : "check-box-outline-blank"}
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
                  <ScreenFieldButton
                    label="StartsAt"
                    value={formatDateTime(editStartsAt)}
                    onPress={() => {
                      setPickerTarget({ owner: "edit", field: "startsAt" });
                      setPickerStage("date");
                    }}
                  />
                  <ScreenFieldButton
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}




