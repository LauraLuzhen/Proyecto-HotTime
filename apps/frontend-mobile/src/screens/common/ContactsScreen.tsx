import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  
  Text,
  TextInput,
  View,
} from "react-native";
import type { CategoriesResponse, GeneralUserResponse, GetUsersQueryDto, Role } from "@hottime/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useAppAlert } from "../../components/AppAlert";
import { ScreenEmptyState } from "../../components/ScreenEmptyState";
import { ScreenSelectField } from "../../components/ScreenSelectField";
import { UserAvatar } from "../../components/UserAvatar";
import { ApiClientError, createApi } from "../../lib/api";
import { tokenStorage } from "../../state/auth/storage";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";

const roles: Role[] = ["ADMIN", "MANAGER", "EMPLOYEE"];

import { contactsStyles as styles } from "../../lib/mobileStyles";
function roleLabel(role: Role) {
  return role.charAt(0) + role.slice(1).toLowerCase();
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
            <ScreenSelectField
              label="Categoria"
              options={categoryOptions}
              placeholder="Elegir categoria"
              valueLabel={selectedCategoryLabel}
              onSelect={setCategoryId}
            />
            <ScreenSelectField
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
          <ScreenEmptyState title="No se han podido cargar los usuarios" detail={error} />
        ) : users.length === 0 ? (
          <ScreenEmptyState
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
                    <UserAvatar uri={user.imgProfile} name={user.fullName} size={40} />
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

