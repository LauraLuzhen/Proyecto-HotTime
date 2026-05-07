import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CategoriesResponse, GeneralUserResponse, GetUsersQueryDto, Role } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { tokenStorage } from "../state/auth/storage";

const roles: Role[] = ["ADMIN", "MANAGER", "EMPLOYEE"];

function initials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

function placeholderAvatarUri(name?: string) {
  const text = encodeURIComponent(initials(name));
  return `https://ui-avatars.com/api/?name=${text}&background=2f5f5b&color=ffffff&size=128&bold=true`;
}

function roleLabel(role: Role) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function SelectField<TValue extends string | number>({
  label,
  placeholder,
  valueLabel,
  options,
  onSelect,
}: {
  label: string;
  placeholder: string;
  valueLabel?: string;
  options: { label: string; value: TValue | null }[];
  onSelect: (value: TValue | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.filterField}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable style={styles.selectButton} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !valueLabel && styles.placeholder]} numberOfLines={1}>
          {valueLabel ?? placeholder}
        </Text>
        <Text style={styles.selectIcon}>v</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.optionsBox}>
            {options.map((option) => (
              <Pressable
                key={`${option.label}-${option.value ?? "all"}`}
                style={styles.option}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

export function ContactsScreen() {
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [users, setUsers] = useState<GeneralUserResponse[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const selectedCategoryLabel = categoryId ? categoriesById.get(categoryId) : undefined;
  const selectedRoleLabel = role ? roleLabel(role) : undefined;

  const categoryOptions = useMemo(
    () => [
      { label: "Todas las categorias", value: null },
      ...categories.map((category) => ({ label: category.name, value: category.id })),
    ],
    [categories]
  );

  const roleOptions = useMemo(
    () => [
      { label: "Todos los roles", value: null },
      ...roles.map((item) => ({ label: roleLabel(item), value: item })),
    ],
    []
  );

  const loadUsers = useCallback(
    async (filters?: GetUsersQueryDto) => {
      setLoading(true);
      setError(null);

      try {
        const result = await api.user.getUsers(filters);
        setUsers(result);
      } catch (err) {
        const e = err as ApiClientError;
        setUsers([]);
        setError(e.message ?? "No se han podido cargar los usuarios.");
      } finally {
        setLoading(false);
      }
    },
    [api.user]
  );

  useEffect(() => {
    async function loadInitialData() {
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
        setUsers([]);
        setError(e.message ?? "No se han podido cargar los usuarios.");
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, [api.category, api.user]);

  function submitFilters() {
    const filters: GetUsersQueryDto = {};
    const trimmedName = nameFilter.trim();

    if (trimmedName) filters.fullName = trimmedName;
    if (categoryId !== null) filters.categoryId = categoryId;
    if (role) filters.role = role;

    void loadUsers(filters);
  }

  function clearFilters() {
    setNameFilter("");
    setCategoryId(null);
    setRole(null);
    setExpandedUserId(null);
    void loadUsers();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.filtersPanel}>
          <Text style={styles.title}>Contactos</Text>

          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>Buscar</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setNameFilter}
              placeholder="Introduce texto"
              style={styles.input}
              value={nameFilter}
            />
          </View>

          <View style={styles.filtersRow}>
            <SelectField
              label="Categoria"
              options={categoryOptions}
              placeholder="Elegir categoria"
              valueLabel={selectedCategoryLabel}
              onSelect={setCategoryId}
            />
            <SelectField
              label="Rol"
              options={roleOptions}
              placeholder="Elegir rol"
              valueLabel={selectedRoleLabel}
              onSelect={setRole}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={submitFilters}>
              <Text style={styles.primaryButtonText}>Enviar</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={clearFilters}>
              <Text style={styles.secondaryButtonText}>Limpiar filtros</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#2f5f5b" />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
          </View>
        ) : error ? (
          <EmptyState title="No se han podido cargar los usuarios" detail={error} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No se han encontrado resultados"
            detail="Prueba a limpiar los filtros o buscar otro nombre."
          />
        ) : (
          <View style={styles.list}>
            {users.map((user) => {
              const expanded = expandedUserId === user.id;
              const categoryName = user.categories.length
                ? user.categories.map((category) => category.name).join(", ")
                : null;

              return (
                <Pressable
                  key={user.id}
                  style={styles.userCard}
                  onPress={() => setExpandedUserId(expanded ? null : user.id)}
                >
                  <View style={styles.userMain}>
                    <Image
                      source={{ uri: user.imgProfile || placeholderAvatarUri(user.fullName) }}
                      style={styles.avatar}
                    />
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.fullName}
                    </Text>
                    <Text style={styles.userCategory} numberOfLines={1}>
                      {categoryName ?? "Sin categoria"}
                    </Text>
                    <Text style={styles.userRole}>{roleLabel(user.role)}</Text>
                  </View>

                  {expanded ? (
                    <View style={styles.userDetails}>
                      <Text style={styles.detailText}>Telefono: {user.phone}</Text>
                      <Text style={styles.detailText}>Email: {user.email}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
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
  },
  filtersPanel: {
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
  filterField: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  filterLabel: {
    color: "#4c4c47",
    fontSize: 13,
    fontWeight: "700",
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
  filtersRow: {
    flexDirection: "row",
    gap: 10,
  },
  selectButton: {
    alignItems: "center",
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  selectText: {
    color: "#1f1f1d",
    flex: 1,
    fontSize: 15,
  },
  placeholder: {
    color: "#777",
  },
  selectIcon: {
    color: "#64645e",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  optionsBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: "70%",
    overflow: "hidden",
    width: "100%",
  },
  option: {
    borderBottomColor: "#eeeeea",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: {
    color: "#1f1f1d",
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
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
    flex: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  loading: {
    alignItems: "center",
    gap: 8,
    padding: 28,
  },
  loadingText: {
    color: "#666",
  },
  empty: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 24,
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
  list: {
    gap: 10,
  },
  userCard: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  userMain: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    backgroundColor: "#dfe7e3",
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  userName: {
    color: "#1f1f1d",
    flex: 1.25,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 0,
  },
  userCategory: {
    color: "#63635e",
    flex: 1,
    fontSize: 13,
    minWidth: 0,
  },
  userRole: {
    color: "#2f5f5b",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 62,
    textAlign: "right",
  },
  userDetails: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
  },
  detailText: {
    color: "#3d3d39",
    fontSize: 14,
  },
});
