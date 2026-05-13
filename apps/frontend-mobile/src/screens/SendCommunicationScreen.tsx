import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CategoriesResponse, CommunicationType, CreateCommunicationDto, GeneralUserResponse } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { normalizeSearchText } from "../lib/schedule";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

type RecipientMode = NonNullable<CreateCommunicationDto["recipientMode"]>;
type FieldErrors = Partial<Record<"title", string>>;

const communicationTypes: CommunicationType[] = ["GENERAL", "INFO", "WARNING", "URGENT"];

function typeLabel(type: CommunicationType) {
  const labels: Record<CommunicationType, string> = {
    GENERAL: "General",
    INFO: "Info",
    WARNING: "Aviso",
    URGENT: "Urgente",
  };
  return labels[type];
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

export function SendCommunicationScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommunicationType>("GENERAL");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("ALL_USERS");
  const [users, setUsers] = useState<GeneralUserResponse[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedWithoutCategory, setSelectedWithoutCategory] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<number[]>([]);
  const [withoutCategoryExpanded, setWithoutCategoryExpanded] = useState(false);
  const [extraCategoryUserIds, setExtraCategoryUserIds] = useState<number[]>([]);
  const [excludedCategoryUserIds, setExcludedCategoryUserIds] = useState<number[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loadRecipients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersResult, categoriesResult] = await Promise.all([
        api.user.getUsers(),
        api.category.getCategories(),
      ]);
      setUsers(usersResult);
      setCategories(categoriesResult);
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se han podido cargar los destinatarios.");
    } finally {
      setLoading(false);
    }
  }, [api.category, api.user]);

  const filteredUsers = useMemo(() => {
    const query = normalizeSearchText(searchText);
    if (!query) return users;

    return users.filter((user) => {
      return (
        normalizeSearchText(user.fullName).includes(query) ||
        normalizeSearchText(user.email).includes(query)
      );
    });
  }, [searchText, users]);

  const usersWithoutCategory = useMemo(() => {
    return users.filter((user) => user.categories.length === 0);
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

  const categoryRecipientIds = useMemo(() => {
    const recipientIds = new Set<number>();
    const excludedIds = new Set(excludedCategoryUserIds);

    selectedCategoryIds.forEach((categoryId) => {
      usersByCategoryId.get(categoryId)?.forEach((user) => {
        if (!excludedIds.has(user.id)) recipientIds.add(user.id);
      });
    });

    if (selectedWithoutCategory) {
      usersWithoutCategory.forEach((user) => {
        if (!excludedIds.has(user.id)) recipientIds.add(user.id);
      });
    }

    extraCategoryUserIds.forEach((userId) => recipientIds.add(userId));

    return recipientIds;
  }, [excludedCategoryUserIds, extraCategoryUserIds, selectedCategoryIds, selectedWithoutCategory, usersByCategoryId, usersWithoutCategory]);

  useEffect(() => {
    void loadRecipients();
  }, [loadRecipients]);

  useRefreshOnFocus(() => {
    void loadRecipients();
  }, [loadRecipients]);

  function toggleUser(userId: number) {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
  }

  function toggleCategory(categoryId: number) {
    const groupUserIds = usersByCategoryId.get(categoryId)?.map((user) => user.id) ?? [];
    if (groupUserIds.length === 0) return;

    setSelectedCategoryIds((current) => (
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    ));
    setExtraCategoryUserIds((current) => current.filter((id) => !groupUserIds.includes(id)));
    setExcludedCategoryUserIds((current) => current.filter((id) => !groupUserIds.includes(id)));
  }

  function toggleCategoryExpanded(categoryId: number) {
    setExpandedCategoryIds((current) => (
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    ));
  }

  function toggleWithoutCategory() {
    const groupUserIds = usersWithoutCategory.map((user) => user.id);
    if (groupUserIds.length === 0) return;

    setSelectedWithoutCategory((current) => !current);
    setExtraCategoryUserIds((current) => current.filter((id) => !groupUserIds.includes(id)));
    setExcludedCategoryUserIds((current) => current.filter((id) => !groupUserIds.includes(id)));
  }

  function toggleCategoryUser(userId: number, selectedByGroup: boolean, groupUserIds: number[], categoryId?: number) {
    if (selectedByGroup) {
      setExcludedCategoryUserIds((current) => {
        const next = current.includes(userId)
          ? current.filter((id) => id !== userId)
          : [...current, userId];
        const nextExcludedSet = new Set(next);
        const activeGroupUsers = groupUserIds.filter((id) => !nextExcludedSet.has(id));

        if (activeGroupUsers.length === 0) {
          if (categoryId === undefined) {
            setSelectedWithoutCategory(false);
          } else {
            setSelectedCategoryIds((selectedCategories) => selectedCategories.filter((id) => id !== categoryId));
          }

          return next.filter((id) => !groupUserIds.includes(id));
        }

        return next;
      });
      return;
    }

    setExtraCategoryUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ));
  }

  async function submitCommunication() {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const errors: FieldErrors = {
      title: trimmedTitle.length >= 3 ? undefined : "Minimo 3 caracteres.",
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    if (!trimmedContent) {
      Alert.alert("Contenido incompleto", "Escribe el contenido del comunicado.");
      return;
    }

    if (recipientMode === "USERS" && selectedUserIds.length === 0) {
      Alert.alert("Sin destinatarios", "Selecciona al menos un usuario.");
      return;
    }

    if (recipientMode === "CATEGORIES" && categoryRecipientIds.size === 0) {
      Alert.alert("Sin categorias", "Selecciona al menos una categoria.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.communication.createCommunication({
        title: trimmedTitle,
        content: trimmedContent,
        type,
        recipientMode,
        recipientUserIds: recipientMode === "USERS" ? selectedUserIds : [],
        recipientCategoryIds: recipientMode === "CATEGORIES" ? selectedCategoryIds : [],
        recipientWithoutCategory: recipientMode === "CATEGORIES" ? selectedWithoutCategory : false,
        recipientExtraUserIds: recipientMode === "CATEGORIES" ? extraCategoryUserIds : [],
        recipientExcludedUserIds: recipientMode === "CATEGORIES" ? excludedCategoryUserIds : [],
      });

      setTitle("");
      setContent("");
      setType("GENERAL");
      setRecipientMode("ALL_USERS");
      setSelectedUserIds([]);
      setSelectedCategoryIds([]);
      setSelectedWithoutCategory(false);
      setExpandedCategoryIds([]);
      setWithoutCategoryExpanded(false);
      setExtraCategoryUserIds([]);
      setExcludedCategoryUserIds([]);
      setSearchText("");
      setFieldErrors({});
      Alert.alert("Comunicado enviado", "El comunicado se ha enviado correctamente.");
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se ha podido enviar el comunicado.");
    } finally {
      setSaving(false);
    }
  }

  if (auth.user?.role === "EMPLOYEE") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState title="Acceso denegado" detail="Esta pantalla solo esta disponible para administradores y managers." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadRecipients()} />}
      >
        <View style={styles.panel}>
          <Text style={styles.title}>Enviar comunicado</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Titulo</Text>
            <TextInput
              onChangeText={(value) => {
                setTitle(value);
                if (fieldErrors.title) setFieldErrors((current) => ({ ...current, title: undefined }));
              }}
              placeholder="Titulo del comunicado"
              style={styles.input}
              value={title}
            />
            {fieldErrors.title ? <Text style={styles.fieldError}>{fieldErrors.title}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.segmentRow}>
              {communicationTypes.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.segmentButton, type === item && styles.segmentButtonActive]}
                  onPress={() => setType(item)}
                >
                  <Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>{typeLabel(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contenido</Text>
            <TextInput
              multiline
              onChangeText={setContent}
              placeholder="Escribe el comunicado"
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={content}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Destinatarios</Text>
          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.modeButton, recipientMode === "ALL_USERS" && styles.modeButtonActive]}
              onPress={() => setRecipientMode("ALL_USERS")}
            >
              <Text style={[styles.modeText, recipientMode === "ALL_USERS" && styles.modeTextActive]}>Todos</Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, recipientMode === "USERS" && styles.modeButtonActive]}
              onPress={() => setRecipientMode("USERS")}
            >
              <Text style={[styles.modeText, recipientMode === "USERS" && styles.modeTextActive]}>Usuarios</Text>
            </Pressable>
            <Pressable
              style={[styles.modeButton, recipientMode === "CATEGORIES" && styles.modeButtonActive]}
              onPress={() => setRecipientMode("CATEGORIES")}
            >
              <Text style={[styles.modeText, recipientMode === "CATEGORIES" && styles.modeTextActive]}>Categorias</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#2f5f5b" />
              <Text style={styles.loadingText}>Cargando destinatarios...</Text>
            </View>
          ) : error ? (
            <EmptyState title="No se han podido cargar datos" detail={error} />
          ) : recipientMode === "ALL_USERS" ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Todos los usuarios</Text>
              <Text style={styles.infoDetail}>
                Se enviara a {users.length} usuarios de tu organizacion. Tu usuario queda excluido.
              </Text>
            </View>
          ) : recipientMode === "USERS" ? (
            <View style={styles.selector}>
              <TextInput
                autoCapitalize="none"
                onChangeText={setSearchText}
                placeholder="Buscar por nombre o email"
                style={styles.input}
                value={searchText}
              />
              <Text style={styles.selectionCount}>{selectedUserIds.length} usuarios seleccionados</Text>
              {filteredUsers.length === 0 ? (
                <EmptyState title="Sin resultados" detail="Prueba otro nombre o email." />
              ) : (
                <View style={styles.list}>
                  {filteredUsers.map((user) => {
                    const selected = selectedUserIds.includes(user.id);
                    const categoriesLabel = user.categories.length
                      ? user.categories.map((category) => category.name).join(", ")
                      : "Sin categoria";

                    return (
                      <Pressable
                        key={user.id}
                        style={[styles.row, selected && styles.rowSelected]}
                        onPress={() => toggleUser(user.id)}
                      >
                        <View style={styles.checkbox}>
                          <Text style={styles.checkboxText}>{selected ? "x" : ""}</Text>
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
            <View style={styles.selector}>
              <Text style={styles.selectionCount}>
                {categoryRecipientIds.size} usuarios seleccionados por categorias
              </Text>
              <View style={styles.list}>
                {(() => {
                  const withoutCategoryIds = usersWithoutCategory.map((user) => user.id);
                  const activeWithoutCategoryUsers = selectedWithoutCategory
                    ? usersWithoutCategory.filter((user) => !excludedCategoryUserIds.includes(user.id)).length
                    : usersWithoutCategory.filter((user) => extraCategoryUserIds.includes(user.id)).length;
                  const visuallySelected = activeWithoutCategoryUsers > 0;

                  return (
                    <View style={[styles.categoryBlock, visuallySelected && styles.rowSelected]}>
                  <View style={styles.categoryHeader}>
                    <Pressable style={styles.checkbox} onPress={toggleWithoutCategory}>
                      <Text style={styles.checkboxText}>{selectedWithoutCategory ? "x" : ""}</Text>
                    </Pressable>
                    <Pressable style={styles.categoryTitleButton} onPress={() => setWithoutCategoryExpanded((current) => !current)}>
                      <Text style={styles.rowTitle}>Sin categoria</Text>
                      <Text style={styles.rowDetail}>
                        {usersWithoutCategory.length === 0 ? "Sin usuarios" : `${activeWithoutCategoryUsers}/${usersWithoutCategory.length} usuarios`}
                      </Text>
                    </Pressable>
                  </View>

                  {withoutCategoryExpanded ? (
                    <View style={styles.categoryUsers}>
                      {usersWithoutCategory.length === 0 ? (
                        <Text style={styles.rowDetail}>No hay usuarios sin categoria.</Text>
                      ) : (
                        usersWithoutCategory.map((user) => {
                          const selectedByGroup = selectedWithoutCategory;
                          const selected = selectedByGroup
                            ? !excludedCategoryUserIds.includes(user.id)
                            : extraCategoryUserIds.includes(user.id);

                          return (
                            <Pressable
                              key={user.id}
                              style={[styles.categoryUserRow, selected && styles.categoryUserRowSelected]}
                              onPress={() => toggleCategoryUser(user.id, selectedByGroup, withoutCategoryIds)}
                            >
                              <View style={styles.smallCheckbox}>
                                <Text style={styles.checkboxText}>{selected ? "x" : ""}</Text>
                              </View>
                              <View style={styles.rowText}>
                                <Text style={styles.rowTitle} numberOfLines={1}>{user.fullName}</Text>
                                <Text style={styles.rowDetail} numberOfLines={1}>{user.email}</Text>
                              </View>
                            </Pressable>
                          );
                        })
                      )}
                    </View>
                  ) : null}
                    </View>
                  );
                })()}

                {categories.map((category) => {
                  const selected = selectedCategoryIds.includes(category.id);
                  const expanded = expandedCategoryIds.includes(category.id);
                  const categoryUsers = usersByCategoryId.get(category.id) ?? [];
                  const categoryUserIds = categoryUsers.map((user) => user.id);
                  const activeCategoryUsers = selected
                    ? categoryUsers.filter((user) => !excludedCategoryUserIds.includes(user.id)).length
                    : categoryUsers.filter((user) => extraCategoryUserIds.includes(user.id)).length;
                  const visuallySelected = activeCategoryUsers > 0;

                  return (
                    <View
                      key={category.id}
                      style={[styles.categoryBlock, visuallySelected && styles.rowSelected]}
                    >
                      <View style={styles.categoryHeader}>
                        <Pressable style={styles.checkbox} onPress={() => toggleCategory(category.id)}>
                          <Text style={styles.checkboxText}>{selected ? "x" : ""}</Text>
                        </Pressable>
                        <Pressable style={styles.categoryTitleButton} onPress={() => toggleCategoryExpanded(category.id)}>
                          <Text style={styles.rowTitle}>{category.name}</Text>
                          <Text style={styles.rowDetail}>
                            {categoryUsers.length === 0 ? "Sin usuarios" : `${activeCategoryUsers}/${categoryUsers.length} usuarios`}
                          </Text>
                        </Pressable>
                      </View>

                      {expanded ? (
                        <View style={styles.categoryUsers}>
                          {categoryUsers.length === 0 ? (
                            <Text style={styles.rowDetail}>No hay usuarios en esta categoria.</Text>
                          ) : (
                            categoryUsers.map((user) => {
                              const selectedByGroup = selected;
                              const selectedUser = selectedByGroup
                                ? !excludedCategoryUserIds.includes(user.id)
                                : extraCategoryUserIds.includes(user.id);

                              return (
                                <Pressable
                                  key={user.id}
                                  style={[styles.categoryUserRow, selectedUser && styles.categoryUserRowSelected]}
                                  onPress={() => toggleCategoryUser(user.id, selectedByGroup, categoryUserIds, category.id)}
                                >
                                  <View style={styles.smallCheckbox}>
                                    <Text style={styles.checkboxText}>{selectedUser ? "x" : ""}</Text>
                                  </View>
                                  <View style={styles.rowText}>
                                    <Text style={styles.rowTitle} numberOfLines={1}>{user.fullName}</Text>
                                    <Text style={styles.rowDetail} numberOfLines={1}>{user.email}</Text>
                                  </View>
                                </Pressable>
                              );
                            })
                          )}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {error && !loading ? <Text style={styles.formError}>{error}</Text> : null}

        <Pressable disabled={saving || loading} style={[styles.submitButton, (saving || loading) && styles.buttonDisabled]} onPress={submitCommunication}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Enviar comunicado</Text>}
        </Pressable>
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
    paddingBottom: 28,
  },
  panel: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  title: {
    color: "#151515",
    fontSize: 22,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#1f1f1d",
    fontSize: 18,
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#4c4c47",
    fontSize: 13,
    fontWeight: "700",
  },
  fieldError: {
    color: "#b42318",
    fontSize: 12,
  },
  input: {
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f1f1d",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  textArea: {
    minHeight: 132,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentButton: {
    alignItems: "center",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  segmentButtonActive: {
    backgroundColor: "#2f5f5b",
    borderColor: "#2f5f5b",
  },
  segmentText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#fff",
  },
  modeButton: {
    alignItems: "center",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    minWidth: 86,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  modeButtonActive: {
    backgroundColor: "#e5efec",
    borderColor: "#2f5f5b",
  },
  modeText: {
    color: "#3d3d39",
    fontWeight: "700",
  },
  modeTextActive: {
    color: "#2f5f5b",
  },
  loading: {
    alignItems: "center",
    gap: 8,
    padding: 22,
  },
  loadingText: {
    color: "#666",
  },
  infoBox: {
    backgroundColor: "#f1f6f4",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  infoTitle: {
    color: "#1f1f1d",
    fontWeight: "700",
  },
  infoDetail: {
    color: "#5c5c56",
  },
  selector: {
    gap: 10,
  },
  selectionCount: {
    color: "#5c5c56",
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    gap: 8,
  },
  row: {
    alignItems: "center",
    borderColor: "#eeeeea",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  categoryBlock: {
    borderColor: "#eeeeea",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  categoryTitleButton: {
    flex: 1,
    minWidth: 0,
  },
  categoryUsers: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
    gap: 7,
    padding: 10,
  },
  categoryUserRow: {
    alignItems: "center",
    borderColor: "#eeeeea",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 8,
  },
  categoryUserRowSelected: {
    backgroundColor: "#f7fbfa",
    borderColor: "#b8cec8",
  },
  rowSelected: {
    backgroundColor: "#f1f6f4",
    borderColor: "#2f5f5b",
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#bfc9c4",
    borderRadius: 6,
    borderWidth: 1,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
  checkboxText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  smallCheckbox: {
    alignItems: "center",
    borderColor: "#bfc9c4",
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: "#1f1f1d",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  rowDetail: {
    color: "#676760",
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 20,
  },
  emptyTitle: {
    color: "#1f1f1d",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDetail: {
    color: "#6a6a64",
    textAlign: "center",
  },
  formError: {
    color: "#b42318",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
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
});
