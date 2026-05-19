import { useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, Text, View, Image } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";

import { useAppAlert } from "../../components/AppAlert";
import { drawerStyles as styles } from "../../lib/mobileStyles";
import { palette } from "../../lib/schedule";
import { useAuth } from "../../state/auth/AuthContext";

type Item = {
  label: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

function DrawerButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemActive,
        pressed && styles.itemPressed,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={active ? "#fff" : palette.accent}
      />
      <Text style={[styles.itemText, active && styles.itemTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const auth = useAuth();
  const appAlert = useAppAlert();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isAdminOrManager = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";
  const isAdmin = auth.user?.role === "ADMIN";
  const activeRoute = props.state.routeNames[props.state.index];

  const mainItems: Item[] = useMemo(() => [
    { label: "Dashboard", route: "Dashboard", icon: "space-dashboard" },
    { label: "Mi horario", route: "MySchedule", icon: "calendar-month" },
    { label: "Mis fichajes", route: "MyAttendance", icon: "fact-check" },
    { label: "Bandeja", route: "Bandeja", icon: "inbox" },
    { label: "Perfil", route: "Profile", icon: "person" },
    { label: "Contactos", route: "Contacts", icon: "contacts" },
  ], []);

  const adminItems: Item[] = useMemo(() => [
    { label: "Horarios", route: "PlanSchedules", icon: "event-available" },
    { label: "Fichajes", route: "PlanAttendance", icon: "how-to-reg" },
    { label: "Enviar comunicado", route: "Communication", icon: "send" },
    ...(isAdmin ? [{ label: "Administración", route: "Administration", icon: "admin-panel-settings" as const }] : []),
    ...(isAdmin ? [{ label: "Organización", route: "Organization", icon: "business" as const }] : []),
  ], [isAdmin]);

  function go(route: string) {
    props.navigation.navigate(route as never);
  }

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.topBlock}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Image source={require("../../img/logo.png")} style={styles.brandMark} />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>HotTime</Text>
            <Text style={styles.brandSubtitle}>{auth.user?.fullName}</Text>
          </View>
        </View>

        <View style={styles.menuBlock}>
          {mainItems.map((item) => (
            <DrawerButton
              key={item.route}
              label={item.label}
              icon={item.icon}
              active={activeRoute === item.route}
              onPress={() => go(item.route)}
            />
          ))}
        </View>

        {isAdminOrManager ? (
          <View style={styles.advancedBlock}>
            <Pressable
              onPress={() => setAdvancedOpen((prev) => !prev)}
              style={({ pressed }) => [styles.advancedToggle, pressed && styles.itemPressed]}
            >
              <Text style={styles.advancedLabel}>Gestión</Text>
              <MaterialIcons
                name={advancedOpen ? "expand-less" : "expand-more"}
                size={22}
                color={palette.accent}
              />
            </Pressable>

            {advancedOpen ? (
              <View style={styles.advancedList}>
                {adminItems.map((item) => (
                  <DrawerButton
                    key={item.route}
                    label={item.label}
                    icon={item.icon}
                    active={activeRoute === item.route}
                    onPress={() => go(item.route)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => {
          appAlert.showAlert({
            title: "Cerrar sesión",
            message: "¿Seguro que quieres cerrar sesión?",
            buttons: [
              { text: "No", style: "cancel" },
              {
                text: "Sí, cerrar",
                style: "destructive",
                onPress: () => {
                  void auth.logout();
                },
              },
            ],
          });
        }}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
      >
        <MaterialIcons name="logout" size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}
