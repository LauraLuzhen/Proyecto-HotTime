import { useCallback, useEffect, useMemo, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import type { CategoriesResponse, GeneralUserResponse, GetUsersQueryDto, Role, UpdateUsersDto } from "@hottime/types";

import { ApiClientError, createApi } from "../lib/api";
import { useAuth } from "../state/auth/AuthContext";
import { tokenStorage } from "../state/auth/storage";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

type CategoryGroup = {
  id: number | null;
  name: string;
  users: GeneralUserResponse[];
};

type FieldErrors = Partial<Record<"fullName" | "email" | "password" | "phone" | "birthDate" | "initDate" | "categoryName", string>>;

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

function formatDate(value?: Date) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInputValue(value?: Date) {
  if (!value) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value)).replace(/\//g, "-");
}

function parseDateInput(value: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function validateName(value: string, minLength: number) {
  return value.trim().length >= minLength ? undefined : `Minimo ${minLength} caracteres.`;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : "Formato email: correo@correo.com.";
}

function validatePassword(value: string, required: boolean) {
  const password = value.trim();
  if (!required && !password) return undefined;
  if (password.length < 8) return "Minimo 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Debe tener 1 mayuscula.";
  if (!/[a-z]/.test(password)) return "Debe tener 1 minuscula.";
  if (!/[0-9]/.test(password)) return "Debe tener 1 numero.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Debe tener 1 caracter especial.";
  return undefined;
}

function validatePhone(value: string) {
  return /^\d{9}$/.test(value.trim()) ? undefined : "Debe tener 9 digitos.";
}

function validateDate(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) return "Formato fecha: DD-MM-YYYY.";
  if (parsed >= new Date()) return "La fecha debe ser anterior a hoy.";
  return undefined;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value ?? "-"}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  keyboardType = "default",
  secureTextEntry,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        style={styles.editInput}
        value={value}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DateField({
  label,
  value,
  onChangeText,
  error,
  maximumDate,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateInput(value) ?? new Date();

  function onChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== "ios") setOpen(false);
    if (event.type === "set" && date) onChangeText(toDateInputValue(date));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.dateButton} onPress={() => setOpen(true)}>
        <Text style={[styles.dateButtonText, !value && styles.datePlaceholder]}>
          {value || "DD-MM-YYYY"}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={maximumDate}
          mode="date"
          onChange={onChange}
          value={selectedDate}
        />
      ) : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function SelectField<TValue extends string | number>({
  label,
  valueLabel,
  options,
  onSelect,
}: {
  label: string;
  valueLabel: string;
  options: { label: string; value: TValue | null }[];
  onSelect: (value: TValue | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.selectButton} onPress={() => setOpen(true)}>
        <Text style={styles.selectButtonText}>{valueLabel}</Text>
        <Text style={styles.selectArrow}>v</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.optionsOverlay} onPress={() => setOpen(false)}>
          <View style={styles.optionsBox}>
            {options.map((option) => (
              <Pressable
                key={`${option.label}-${option.value ?? "none"}`}
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

function MultiSelectField({
  label,
  valueLabel,
  options,
  selectedValues,
  onToggle,
}: {
  label: string;
  valueLabel: string;
  options: { label: string; value: number }[];
  selectedValues: number[];
  onToggle: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.selectButton} onPress={() => setOpen(true)}>
        <Text style={styles.selectButtonText}>{valueLabel}</Text>
        <Text style={styles.selectArrow}>v</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.optionsOverlay} onPress={() => setOpen(false)}>
          <View style={styles.optionsBox}>
            {options.map((option) => {
              const selected = selectedSet.has(option.value);
              return (
                <Pressable
                  key={`${option.label}-${option.value}`}
                  style={styles.option}
                  onPress={() => onToggle(option.value)}
                >
                  <Text style={styles.optionText}>{selected ? "x " : ""}{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function AdministrationScreen() {
  const auth = useAuth();
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [users, setUsers] = useState<GeneralUserResponse[]>([]);
  const [categories, setCategories] = useState<CategoriesResponse[]>([]);
  const [searchText, setSearchText] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null | "none">(null);
  const [selectedUser, setSelectedUser] = useState<GeneralUserResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoriesResponse | null>(null);
  const [categoryEditing, setCategoryEditing] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [createMode, setCreateMode] = useState<"user" | "category" | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formBirthDate, setFormBirthDate] = useState("");
  const [formInitDate, setFormInitDate] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Role>("EMPLOYEE");
  const [formCategoryIds, setFormCategoryIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [createCategoryName, setCreateCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const groups = useMemo<CategoryGroup[]>(() => {
    const groupsById = new Map<number | null, CategoryGroup>();

    categories.forEach((category) => {
      groupsById.set(category.id, { id: category.id, name: category.name, users: [] });
    });

    groupsById.set(null, { id: null, name: "Sin categoria", users: [] });

    users.forEach((user) => {
      if (user.categories.length === 0) {
        groupsById.get(null)?.users.push(user);
        return;
      }

      user.categories.forEach((category) => {
        groupsById.get(category.id)?.users.push(user);
      });
    });

    const categoryGroups = categories.map((category) => groupsById.get(category.id)!);
    const noCategoryGroup = groupsById.get(null)!;

    return [...categoryGroups, noCategoryGroup];
  }, [categories, users]);

  const selectedUserCategories = selectedUser?.categories.length
    ? selectedUser.categories.map((category) => category.name).join(", ")
    : "Sin categoria";

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ label: category.name, value: category.id })),
    [categories]
  );

  const roleOptions = useMemo(
    () => roles.map((item) => ({ label: roleLabel(item), value: item })),
    []
  );

  const selectedFormCategories = formCategoryIds.length
    ? formCategoryIds.map((id) => categoriesById.get(id)).filter(Boolean).join(", ")
    : "Sin categoria";

  const loadData = useCallback(
    async (filters?: GetUsersQueryDto) => {
      setLoading(true);
      setError(null);

      try {
        const [usersResult, categoriesResult] = await Promise.all([
          api.user.getUsers(filters),
          api.category.getCategories(),
        ]);

        setUsers(usersResult);
        setCategories(categoriesResult);
      } catch (err) {
        const e = err as ApiClientError;
        setUsers([]);
        setError(e.message ?? "No se ha podido cargar la administracion.");
      } finally {
        setLoading(false);
      }
    },
    [api.category, api.user]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useRefreshOnFocus(() => {
    void loadData(currentFilters());
  }, [loadData, searchText]);

  function submitSearch() {
    const fullName = searchText.trim();
    setExpandedCategoryId(null);
    setSelectedUser(null);
    void loadData(fullName ? { fullName } : undefined);
  }

  function currentFilters() {
    const fullName = searchText.trim();
    return fullName ? { fullName } : undefined;
  }

  function closePreview() {
    setSelectedUser(null);
    setEditing(false);
    setFormError(null);
    setFieldErrors({});
  }

  function closeCategoryPreview() {
    setSelectedCategory(null);
    setCategoryEditing(false);
    setCategoryName("");
    setFormError(null);
    setFieldErrors({});
  }

  function closeCreateModal() {
    setCreateMode(null);
    setFabOpen(false);
    setFormError(null);
    setFieldErrors({});
    setCreateCategoryName("");
    setFormFullName("");
    setFormEmail("");
    setFormPhone("");
    setFormBirthDate("");
    setFormInitDate("");
    setFormPassword("");
    setFormRole("EMPLOYEE");
    setFormCategoryIds([]);
  }

  function startEditing() {
    if (!selectedUser) return;

    setFormFullName(selectedUser.fullName);
    setFormEmail(selectedUser.email);
    setFormPhone(selectedUser.phone);
    setFormBirthDate(toDateInputValue(selectedUser.birthDate));
    setFormInitDate(toDateInputValue(selectedUser.initDate));
    setFormPassword("");
    setFormRole(selectedUser.role);
    setFormCategoryIds(selectedUser.categories.map((category) => category.id));
    setFormError(null);
    setFieldErrors({});
    setEditing(true);
  }

  function openCreateUser() {
    setCreateMode("user");
    setFabOpen(false);
    setFormFullName("");
    setFormEmail("");
    setFormPhone("");
    setFormBirthDate("");
    setFormPassword("");
    setFormRole("EMPLOYEE");
    setFormCategoryIds([]);
    setFormError(null);
    setFieldErrors({});
  }

  function openCreateCategory() {
    setCreateMode("category");
    setFabOpen(false);
    setCreateCategoryName("");
    setFormError(null);
    setFieldErrors({});
  }

  function openCategoryPreview(category: CategoriesResponse) {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCategoryEditing(false);
    setFormError(null);
    setFieldErrors({});
  }

  async function saveUser() {
    if (!selectedUser) return;

    const errors: FieldErrors = {
      fullName: validateName(formFullName, 5),
      email: validateEmail(formEmail),
      phone: validatePhone(formPhone),
      birthDate: validateDate(formBirthDate),
      initDate: validateDate(formInitDate),
      password: validatePassword(formPassword, false),
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const birthDate = parseDateInput(formBirthDate)!;
    const initDate = parseDateInput(formInitDate)!;

    setSaving(true);
    setFormError(null);

    const data: UpdateUsersDto = {
      fullName: formFullName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      birthDate,
      initDate,
      role: formRole,
      categoryIds: formCategoryIds,
    };

    if (formPassword.trim()) data.password = formPassword.trim();

    try {
      const updated = await api.user.updateUsers(selectedUser.id, data);
      setUsers((current) => current.map((user) => (user.id === selectedUser.id ? updated : user)));
      setSelectedUser(updated);
      setEditing(false);
    } catch (err) {
      const e = err as ApiClientError;
      setFormError(e.message ?? "No se ha podido guardar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function createUser() {
    const errors: FieldErrors = {
      fullName: validateName(formFullName, 5),
      email: validateEmail(formEmail),
      password: validatePassword(formPassword, true),
      phone: validatePhone(formPhone),
      birthDate: validateDate(formBirthDate),
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const birthDate = parseDateInput(formBirthDate)!;

    setSaving(true);
    setFormError(null);

    try {
      await api.user.createUser({
        fullName: formFullName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        role: formRole,
        birthDate,
        phone: formPhone.trim(),
        categoryIds: formCategoryIds,
      });
      closeCreateModal();
      await loadData(currentFilters());
    } catch (err) {
      const e = err as ApiClientError;
      setFormError(e.message ?? "No se ha podido crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function createCategory() {
    const errors: FieldErrors = {
      categoryName: validateName(createCategoryName, 3),
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await api.category.createCategory({ name: createCategoryName.trim() });
      closeCreateModal();
      await loadData(currentFilters());
    } catch (err) {
      const e = err as ApiClientError;
      setFormError(e.message ?? "No se ha podido crear la categoria.");
    } finally {
      setSaving(false);
    }
  }

  function toggleFormCategory(categoryId: number) {
    setFormCategoryIds((current) => (
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    ));
  }

  async function saveCategory() {
    if (!selectedCategory) return;

    const errors: FieldErrors = {
      categoryName: validateName(categoryName, 3),
    };

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const updated = await api.category.updateCategory(selectedCategory.id, { name: categoryName.trim() });
      setCategories((current) => current.map((category) => (category.id === updated.id ? updated : category)));
      setSelectedCategory(updated);
      setCategoryEditing(false);
    } catch (err) {
      const e = err as ApiClientError;
      setFormError(e.message ?? "No se ha podido guardar la categoria.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteUser() {
    if (!selectedUser) return;

    Alert.alert("Eliminar usuario", "Seguro que quieres eliminar este usuario?", [
      { text: "No", style: "cancel" },
      {
        text: "Si",
        style: "destructive",
        onPress: () => {
          void deleteUser();
        },
      },
    ]);
  }

  function confirmDeleteCategory() {
    if (!selectedCategory) return;

    Alert.alert("Eliminar categoria", "Seguro que quieres eliminar esta categoria?", [
      { text: "No", style: "cancel" },
      {
        text: "Si",
        style: "destructive",
        onPress: () => {
          void deleteCategory();
        },
      },
    ]);
  }

  async function deleteUser() {
    if (!selectedUser) return;

    try {
      await api.user.deleteUser(selectedUser.id);
      setUsers((current) => current.filter((user) => user.id !== selectedUser.id));
      closePreview();
    } catch (err) {
      const e = err as ApiClientError;
      Alert.alert("No se ha podido eliminar", e.message ?? "Prueba de nuevo.");
    }
  }

  async function deleteCategory() {
    if (!selectedCategory) return;

    try {
      await api.category.deleteCategory(selectedCategory.id);
      closeCategoryPreview();
      await loadData(currentFilters());
    } catch (err) {
      const e = err as ApiClientError;
      Alert.alert("No se ha podido eliminar", e.message ?? "Prueba de nuevo.");
    }
  }

  if (auth.user?.role !== "ADMIN") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState title="Acceso denegado" detail="Esta pantalla solo esta disponible para administradores." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadData(currentFilters())} />}
      >
        <View style={styles.searchPanel}>
          <Text style={styles.title}>Administracion</Text>
          <View style={styles.searchRow}>
            <TextInput
              autoCapitalize="words"
              onChangeText={setSearchText}
              placeholder="Buscar por nombre"
              style={styles.input}
              value={searchText}
            />
            <Pressable style={styles.submitButton} onPress={submitSearch}>
              <Text style={styles.submitButtonText}>Enviar</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#2f5f5b" />
            <Text style={styles.loadingText}>Cargando administracion...</Text>
          </View>
        ) : error ? (
          <EmptyState title="No se han podido cargar los datos" detail={error} />
        ) : categories.length === 0 && users.length === 0 ? (
          <EmptyState
            title="No se han encontrado resultados"
            detail="No hay categorias ni usuarios para administrar."
          />
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => {
              const groupKey = group.id ?? "none";
              const expanded = expandedCategoryId === groupKey;

              return (
                <View key={groupKey} style={styles.groupCard}>
                  <Pressable
                    style={styles.groupHeader}
                    onPress={() => setExpandedCategoryId(expanded ? null : groupKey)}
                  >
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupCount}>{group.users.length}</Text>
                    {group.id !== null ? (
                      <Pressable
                        style={styles.categoryActionButton}
                        onPress={() => {
                          const category = categories.find((item) => item.id === group.id);
                          if (category) openCategoryPreview(category);
                        }}
                      >
                        <Text style={styles.categoryActionText}>+</Text>
                      </Pressable>
                    ) : null}
                  </Pressable>

                  {expanded ? (
                    group.users.length === 0 ? (
                      <Text style={styles.groupEmpty}>No hay usuarios en esta categoria.</Text>
                    ) : (
                      <View style={styles.userList}>
                        {group.users.map((user) => (
                          <Pressable
                            key={user.id}
                            style={styles.userRow}
                            onPress={() => setSelectedUser(user)}
                          >
                            <Image
                              source={{ uri: user.imgProfile || placeholderAvatarUri(user.fullName) }}
                              style={styles.avatar}
                            />
                            <Text style={styles.userName} numberOfLines={1}>
                              {user.fullName}
                            </Text>
                            <Text style={styles.userRole}>{roleLabel(user.role)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={selectedUser !== null}
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selectedUser ? (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Pressable style={styles.xButton} onPress={closePreview}>
                  <Text style={styles.xButtonText}>X</Text>
                </Pressable>

                <View style={styles.previewHeader}>
                  <Image
                    source={{ uri: selectedUser.imgProfile || placeholderAvatarUri(selectedUser.fullName) }}
                    style={styles.previewAvatar}
                  />
                  <Text style={styles.previewName}>{selectedUser.fullName}</Text>
                  <Text style={styles.previewRole}>{roleLabel(selectedUser.role)}</Text>
                </View>

                {editing ? (
                  <View style={styles.editPanel}>
                    <Field label="Nombre" value={formFullName} onChangeText={setFormFullName} error={fieldErrors.fullName} />
                    <Field
                      autoCapitalize="none"
                      keyboardType="email-address"
                      label="Email"
                      value={formEmail}
                      onChangeText={setFormEmail}
                      error={fieldErrors.email}
                    />
                    <Field keyboardType="phone-pad" label="Telefono" value={formPhone} onChangeText={setFormPhone} error={fieldErrors.phone} />
                    <DateField
                      label="Nacimiento"
                      value={formBirthDate}
                      onChangeText={setFormBirthDate}
                      error={fieldErrors.birthDate}
                      maximumDate={new Date()}
                    />
                    <DateField
                      label="Alta"
                      value={formInitDate}
                      onChangeText={setFormInitDate}
                      error={fieldErrors.initDate}
                      maximumDate={new Date()}
                    />
                    <Field
                      autoCapitalize="none"
                      label="Nueva password"
                      placeholder="Dejala vacia para no cambiarla"
                      secureTextEntry
                      value={formPassword}
                      onChangeText={setFormPassword}
                      error={fieldErrors.password}
                    />
                    <SelectField
                      label="Rol"
                      options={roleOptions}
                      valueLabel={roleLabel(formRole)}
                      onSelect={(value) => {
                        if (value) setFormRole(value);
                      }}
                    />
                    <MultiSelectField
                      label="Categorias"
                      options={categoryOptions}
                      selectedValues={formCategoryIds}
                      valueLabel={selectedFormCategories}
                      onToggle={toggleFormCategory}
                    />

                    {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                    <View style={styles.modalActions}>
                      <Pressable disabled={saving} style={styles.cancelButton} onPress={() => setEditing(false)}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </Pressable>
                      <Pressable disabled={saving} style={styles.saveButton} onPress={saveUser}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.detailsPanel}>
                      <DetailRow label="Email" value={selectedUser.email} />
                      <DetailRow label="Telefono" value={selectedUser.phone} />
                      <DetailRow label="Categorias" value={selectedUserCategories} />
                      <DetailRow label="Rol" value={roleLabel(selectedUser.role)} />
                      <DetailRow label="Nacimiento" value={formatDate(selectedUser.birthDate)} />
                      <DetailRow label="Alta" value={formatDate(selectedUser.initDate)} />
                      <DetailRow label="Organizacion" value={auth.user.organization.name} />
                    </View>

                    <View style={styles.modalActions}>
                      <Pressable style={styles.editButton} onPress={startEditing}>
                        <Text style={styles.editButtonText}>Editar</Text>
                      </Pressable>
                      <Pressable style={styles.deleteButton} onPress={confirmDeleteUser}>
                        <Text style={styles.deleteButtonText}>Eliminar</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={selectedCategory !== null}
        onRequestClose={closeCategoryPreview}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {selectedCategory ? (
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Pressable style={styles.xButton} onPress={closeCategoryPreview}>
                  <Text style={styles.xButtonText}>X</Text>
                </Pressable>

                <View style={styles.previewHeader}>
                  <Text style={styles.previewName}>{selectedCategory.name}</Text>
                  <Text style={styles.previewRole}>
                    {groups.find((group) => group.id === selectedCategory.id)?.users.length ?? 0} usuarios
                  </Text>
                </View>

                {categoryEditing ? (
                  <View style={styles.editPanel}>
                    <Field label="Nombre" value={categoryName} onChangeText={setCategoryName} error={fieldErrors.categoryName} />
                    {formError ? <Text style={styles.formError}>{formError}</Text> : null}

                    <View style={styles.modalActions}>
                      <Pressable disabled={saving} style={styles.cancelButton} onPress={() => setCategoryEditing(false)}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </Pressable>
                      <Pressable disabled={saving} style={styles.saveButton} onPress={saveCategory}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.detailsPanel}>
                      <DetailRow label="Nombre" value={selectedCategory.name} />
                    </View>

                    <View style={styles.modalActions}>
                      <Pressable style={styles.editButton} onPress={() => setCategoryEditing(true)}>
                        <Text style={styles.editButtonText}>Editar</Text>
                      </Pressable>
                      <Pressable style={styles.deleteButton} onPress={confirmDeleteCategory}>
                        <Text style={styles.deleteButtonText}>Eliminar</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={createMode !== null} onRequestClose={closeCreateModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Pressable style={styles.xButton} onPress={closeCreateModal}>
                <Text style={styles.xButtonText}>X</Text>
              </Pressable>

              <Text style={styles.previewName}>
                {createMode === "user" ? "Crear usuario" : "Crear categoria"}
              </Text>

              {createMode === "user" ? (
                <View style={styles.editPanel}>
                  <Field label="Nombre" value={formFullName} onChangeText={setFormFullName} error={fieldErrors.fullName} />
                  <Field
                    autoCapitalize="none"
                    keyboardType="email-address"
                    label="Email"
                    value={formEmail}
                    onChangeText={setFormEmail}
                    error={fieldErrors.email}
                  />
                  <Field
                    autoCapitalize="none"
                    label="Password"
                    secureTextEntry
                    value={formPassword}
                    onChangeText={setFormPassword}
                    error={fieldErrors.password}
                  />
                  <Field keyboardType="phone-pad" label="Telefono" value={formPhone} onChangeText={setFormPhone} error={fieldErrors.phone} />
                  <DateField
                    label="Nacimiento"
                    value={formBirthDate}
                    onChangeText={setFormBirthDate}
                    error={fieldErrors.birthDate}
                    maximumDate={new Date()}
                  />
                  <SelectField
                    label="Rol"
                    options={roleOptions}
                    valueLabel={roleLabel(formRole)}
                    onSelect={(value) => {
                      if (value) setFormRole(value);
                    }}
                  />
                  <MultiSelectField
                    label="Categorias"
                    options={categoryOptions}
                    selectedValues={formCategoryIds}
                    valueLabel={selectedFormCategories}
                    onToggle={toggleFormCategory}
                  />
                </View>
              ) : (
                <Field label="Nombre" value={createCategoryName} onChangeText={setCreateCategoryName} error={fieldErrors.categoryName} />
              )}

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <View style={styles.modalActions}>
                <Pressable disabled={saving} style={styles.cancelButton} onPress={closeCreateModal}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  disabled={saving}
                  style={styles.saveButton}
                  onPress={createMode === "user" ? createUser : createCategory}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.fabContainer}>
        {fabOpen ? (
          <View style={styles.fabMenu}>
            <Pressable style={styles.fabMenuButton} onPress={openCreateUser}>
              <Text style={styles.fabMenuText}>+ user</Text>
            </Pressable>
            <Pressable style={styles.fabMenuButton} onPress={openCreateCategory}>
              <Text style={styles.fabMenuText}>+ category</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable style={styles.fab} onPress={() => setFabOpen((current) => !current)}>
          <Text style={styles.fabText}>{fabOpen ? "X" : "+ Añadir"}</Text>
        </Pressable>
      </View>
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
    paddingBottom: 104,
  },
  searchPanel: {
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
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f1f1d",
    flex: 1,
    fontSize: 16,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    justifyContent: "center",
    minWidth: 88,
    paddingHorizontal: 14,
  },
  submitButtonText: {
    color: "#fff",
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
  groupsList: {
    gap: 10,
  },
  groupCard: {
    backgroundColor: "#fff",
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  groupName: {
    color: "#1f1f1d",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  groupCount: {
    backgroundColor: "#e5efec",
    borderRadius: 8,
    color: "#2f5f5b",
    fontWeight: "700",
    minWidth: 36,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    textAlign: "center",
  },
  categoryActionButton: {
    alignItems: "center",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  categoryActionText: {
    color: "#2f5f5b",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
  groupEmpty: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
    color: "#6a6a64",
    padding: 14,
  },
  userList: {
    borderTopColor: "#eeeeea",
    borderTopWidth: 1,
  },
  userRow: {
    alignItems: "center",
    borderBottomColor: "#f0f0ec",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatar: {
    backgroundColor: "#dfe7e3",
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  userName: {
    color: "#1f1f1d",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    minWidth: 0,
  },
  userRole: {
    color: "#2f5f5b",
    fontSize: 12,
    fontWeight: "700",
    minWidth: 62,
    textAlign: "right",
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: "88%",
  },
  modalContent: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  xButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  xButtonText: {
    color: "#2f2f2b",
    fontWeight: "700",
  },
  previewHeader: {
    alignItems: "center",
    gap: 8,
  },
  previewAvatar: {
    backgroundColor: "#dfe7e3",
    borderRadius: 48,
    height: 96,
    width: 96,
  },
  previewName: {
    color: "#151515",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  previewRole: {
    color: "#676760",
    fontSize: 15,
  },
  detailsPanel: {
    borderColor: "#deded8",
    borderRadius: 8,
    borderWidth: 1,
  },
  detailRow: {
    borderBottomColor: "#eeeeea",
    borderBottomWidth: 1,
    gap: 4,
    padding: 12,
  },
  detailLabel: {
    color: "#6a6a64",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#222",
    fontSize: 16,
  },
  editPanel: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: "#4c4c47",
    fontSize: 13,
    fontWeight: "700",
  },
  fieldError: {
    color: "#b42318",
    fontSize: 12,
  },
  editInput: {
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1f1f1d",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButton: {
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  dateButtonText: {
    color: "#1f1f1d",
    fontSize: 16,
  },
  datePlaceholder: {
    color: "#777",
  },
  selectButton: {
    alignItems: "center",
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: 12,
  },
  selectButtonText: {
    color: "#1f1f1d",
    flex: 1,
    fontSize: 16,
  },
  selectArrow: {
    color: "#64645e",
    fontSize: 12,
    fontWeight: "700",
  },
  optionsOverlay: {
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
  formError: {
    color: "#b42318",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#b42318",
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#d7d7d0",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: "#3d3d39",
    fontWeight: "700",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  fabContainer: {
    alignItems: "flex-end",
    bottom: 24,
    gap: 10,
    position: "absolute",
    right: 16,
  },
  fabMenu: {
    gap: 8,
  },
  fabMenuButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#cfd6d2",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 112,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  fabMenuText: {
    color: "#2f5f5b",
    fontWeight: "700",
  },
  fab: {
    alignItems: "center",
    backgroundColor: "#2f5f5b",
    borderRadius: 8,
    elevation: 4,
    minWidth: 112,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
  },
});
