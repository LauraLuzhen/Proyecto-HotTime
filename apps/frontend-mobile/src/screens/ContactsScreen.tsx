import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { CategoriesResponse, GeneralUserResponse, GetUsersQueryDto, Role } from "@hottime/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAppAlert } from "../components/AppAlert";
import { ApiClientError, createApi } from "../lib/api";
import { tokenStorage } from "../state/auth/storage";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

const roles: Role[] = ["ADMIN", "MANAGER", "EMPLOYEE"];

function initials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

function Avatar({ uri, name, size }: { uri?: string | null; name?: string; size: number }) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#e4e7ff" }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "#c4b5fd",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.32, fontWeight: "700" }}>
        {initials(name)}
      </Text>
    </View>
  );
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
        <MaterialIcons name="keyboard-arrow-down" size={20} color="#6a6a64" />
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
  const appAlert = useAppAlert();
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

  function buildFilters() {
    const filters: GetUsersQueryDto = {};
    const trimmedName = nameFilter.trim();

    if (trimmedName) filters.fullName = trimmedName;
    if (categoryId !== null) filters.categoryId = categoryId;
    if (role) filters.role = role;

    return filters;
  }

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

  useRefreshOnFocus(() => {
    void loadUsers(buildFilters());
  }, [categoryId, loadUsers, nameFilter, role]);

  function submitFilters() {
    void loadUsers(buildFilters());
  }

  function clearFilters() {
    setNameFilter("");
    setCategoryId(null);
    setRole(null);
    setExpandedUserId(null);
    void loadUsers();
  }

  async function openPhone(phone: string) {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      appAlert.showAlert({
        title: "No se puede llamar",
        message: "No se ha podido abrir la aplicación de teléfono.",
      });
    }
  }

  async function openEmail(email: string) {
    const encodedEmail = encodeURIComponent(email);
    const gmailUrl = `googlegmail://co?to=${encodedEmail}`;
    const mailtoUrl = `mailto:${encodedEmail}`;

    try {
      if (await Linking.canOpenURL(gmailUrl)) {
        await Linking.openURL(gmailUrl);
        return;
      }

      await Linking.openURL(mailtoUrl);
    } catch {
      appAlert.showAlert({
        title: "No se puede abrir email",
        message: "No se ha podido abrir la aplicacion de correo.",
      });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadUsers(buildFilters())} />}
      >
        <View style={styles.filtersPanel}>
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
            <ActivityIndicator color="#5f6df5" />
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
                    <Avatar uri={user.imgProfile} name={user.fullName} size={40} />
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
                      <View style={styles.detailActionRow}>
                        <Text style={styles.detailText}>Teléfono: {user.phone}</Text>
                        <Pressable style={styles.detailActionButton} onPress={() => void openPhone(user.phone)}>
                          <MaterialIcons name="phone" size={18} color="#5f6df5" />
                        </Pressable>
                      </View>
                      <View style={styles.detailActionRow}>
                        <Text style={styles.detailText}>Email: {user.email}</Text>
                        <Pressable style={styles.detailActionButton} onPress={() => void openEmail(user.email)}>
                          <MaterialIcons name="email" size={18} color="#5f6df5" />
                        </Pressable>
                      </View>
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
    backgroundColor: "#eef3ff",
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  filtersPanel: {
    backgroundColor: "#fff",
    borderColor: "#d7ddff",
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
    borderColor: "#d7ddff",
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
    borderColor: "#d7ddff",
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
    borderBottomColor: "#e8ecff",
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
    backgroundColor: "#5f6df5",
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
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#5f6df5",
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
    borderColor: "#d7ddff",
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
    borderColor: "#d7ddff",
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
    backgroundColor: "#e4e7ff",
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
    color: "#5f6df5",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 62,
    textAlign: "right",
  },
  userDetails: {
    borderTopColor: "#e8ecff",
    borderTopWidth: 1,
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
  },
  detailActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  detailText: {
    color: "#3d3d39",
    flex: 1,
    fontSize: 14,
    minWidth: 0,
  },
  detailActionButton: {
    alignItems: "center",
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  detailActionText: {
    color: "#5f6df5",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
});


