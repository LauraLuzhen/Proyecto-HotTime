import { useMemo, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { CommunicationDetailResponse, CommunicationInboxResponse, CommunicationType } from "@hottime/types";

import { useAuth } from "../state/auth/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { AdministrationScreen } from "../screens/AdministrationScreen";
import { ManagerOnlyScreen } from "../screens/ManagerOnlyScreen";
import { EmployeeOnlyScreen } from "../screens/EmployeeOnlyScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ContactsScreen } from "../screens/ContactsScreen";
import { DrawerContent } from "./drawer/DrawerContent";
import { SendCommunicationScreen } from "../screens/SendCommunicationScreen";
import { BandejaScreen } from "../screens/BandejaScreen";
import { OrganizationScreen } from "../screens/OrganizationScreen";
import { PlanSchedulesScreen } from "../screens/PlanSchedulesScreen";
import { PlanAttendanceScreen } from "../screens/PlanAttendanceScreen";
import { MyScheduleScreen } from "../screens/MyScheduleScreen";
import { MyAttendanceScreen } from "../screens/MyAttendanceScreen";
import { ApiClientError, createApi } from "../lib/api";
import { palette } from "../lib/schedule";
import { tokenStorage } from "../state/auth/storage";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function typeLabel(type: CommunicationType) {
  const labels: Record<CommunicationType, string> = {
    GENERAL: "General",
    INFO: "Info",
    WARNING: "Aviso",
    URGENT: "Urgente",
  };
  return labels[type];
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function previewText(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 86 ? `${clean.slice(0, 86)}...` : clean;
}

function HeaderInboxButton({ navigation }: { navigation: any }) {
  const api = useMemo(() => createApi(() => tokenStorage.get()), []);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CommunicationInboxResponse[]>([]);
  const [detail, setDetail] = useState<CommunicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLatest() {
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const result = await api.communication.getInbox();
      setItems(result.slice(0, 5));
    } catch (err) {
      const e = err as ApiClientError;
      setItems([]);
      setError(e.message ?? "No se han podido cargar los comunicados.");
    } finally {
      setLoading(false);
    }
  }

  async function openCommunication(communicationId: number) {
    setDetailLoading(true);
    setError(null);

    try {
      const result = await api.communication.getById(communicationId);
      setDetail(result);
      const refreshed = await api.communication.getInbox();
      setItems(refreshed.slice(0, 5));
    } catch (err) {
      const e = err as ApiClientError;
      setError(e.message ?? "No se ha podido abrir el comunicado.");
    } finally {
      setDetailLoading(false);
    }
  }

  function goToInbox() {
    setOpen(false);
    setDetail(null);
    navigation.navigate("Bandeja");
  }

  return (
    <>
      <Pressable style={styles.headerInboxButton} onPress={() => void loadLatest()}>
        <MaterialIcons name="mail-outline" size={18} color={palette.accent} />
        <Text style={styles.headerInboxButtonText}>Inbox</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.inboxPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Ultimos comunicados</Text>
              <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
                <MaterialIcons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#5f6df5" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : items.length === 0 ? (
              <Text style={styles.emptyText}>No tienes comunicados.</Text>
            ) : (
              <View style={styles.latestList}>
                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.latestItem, !item.read && styles.latestItemUnread]}
                    onPress={() => void openCommunication(item.id)}
                  >
                    <View style={styles.latestTopRow}>
                      <Text style={styles.latestTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.latestState, !item.read && styles.latestStateUnread]}>
                        {item.read ? "Leido" : "Nuevo"}
                      </Text>
                    </View>
                    <Text style={styles.latestMeta} numberOfLines={1}>
                      {item.sender.fullName} - {typeLabel(item.type)} - {formatDate(item.sentAt)}
                    </Text>
                    <Text style={styles.latestPreview}>{previewText(item.content)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable style={styles.viewAllButton} onPress={goToInbox}>
              <Text style={styles.viewAllText}>Ver todo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="slide" visible={detail !== null} onRequestClose={() => setDetail(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailPanel}>
            {detailLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#5f6df5" />
              </View>
            ) : detail ? (
              <ScrollView contentContainerStyle={styles.detailContent}>
                <Pressable style={styles.closeButton} onPress={() => setDetail(null)}>
                  <MaterialIcons name="close" size={18} color={palette.text} />
                </Pressable>
                <Text style={styles.detailTitle}>{detail.title}</Text>
                <Text style={styles.detailMeta}>{detail.sender.fullName} - {detail.sender.email}</Text>
                <Text style={styles.detailMeta}>{typeLabel(detail.type)} - {formatDate(detail.sentAt)}</Text>
                <View style={styles.detailBody}>
                  <Text style={styles.detailText}>{detail.content}</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: palette.surfaceElevated,
        },
        headerTitleStyle: {
          color: palette.text,
          fontWeight: "800",
        },
        headerTintColor: palette.accent,
        drawerActiveBackgroundColor: palette.accentSoft,
        drawerActiveTintColor: palette.accent,
        drawerInactiveTintColor: palette.text,
        drawerLabelStyle: {
          fontWeight: "700",
        },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }) => ({
          title: "HotTime",
          headerRight: () => <HeaderInboxButton navigation={navigation} />,
        })}
      />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Contacts" component={ContactsScreen} />
      <Drawer.Screen name="Administration" component={AdministrationScreen} />
      <Drawer.Screen name="Communication" component={SendCommunicationScreen} />
      <Drawer.Screen name="PlanSchedules" component={PlanSchedulesScreen} />
      <Drawer.Screen name="Bandeja" component={BandejaScreen} />
      <Drawer.Screen name="Organization" component={OrganizationScreen} />
      <Drawer.Screen name="MySchedule" component={MyScheduleScreen} />
      <Drawer.Screen name="MyAttendance" component={MyAttendanceScreen} />
      <Drawer.Screen name="PlanAttendance" component={PlanAttendanceScreen} />
      <Drawer.Screen name="Manager" component={ManagerOnlyScreen} />
      <Drawer.Screen name="Employee" component={EmployeeOnlyScreen} />
    </Drawer.Navigator>
  );
}

export function RootNavigator() {
  const auth = useAuth();

  if (auth.status === "loading") return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {auth.status === "anonymous" ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="App" component={AppDrawer} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerInboxButton: {
    alignItems: "center",
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 12,
    minHeight: 34,
    gap: 6,
    paddingHorizontal: 12,
    justifyContent: "center",
    flexDirection: "row",
  },
  headerInboxButtonText: {
    color: palette.accent,
    fontWeight: "700",
  },
  overlay: {
    alignItems: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 72,
  },
  inboxPanel: {
    backgroundColor: "#fff",
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: "78%",
    padding: 12,
    width: "92%",
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  panelTitle: {
    color: "#151515",
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  closeButton: {
    alignItems: "center",
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  closeButtonText: {
    color: "#2f2f2b",
    fontWeight: "700",
  },
  loadingBox: {
    alignItems: "center",
    gap: 8,
    padding: 22,
  },
  loadingText: {
    color: "#666",
  },
  errorText: {
    color: "#b42318",
    paddingVertical: 12,
  },
  emptyText: {
    color: "#6a6a64",
    paddingVertical: 12,
  },
  latestList: {
    gap: 8,
  },
  latestItem: {
    borderColor: "#e8ecff",
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 10,
  },
  latestItemUnread: {
    backgroundColor: "#f7f8ff",
    borderColor: "#5f6df5",
  },
  latestTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  latestTitle: {
    color: "#1f1f1d",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  latestState: {
    color: "#6a6a64",
    fontSize: 12,
    fontWeight: "700",
  },
  latestStateUnread: {
    color: "#5f6df5",
  },
  latestMeta: {
    color: "#64645e",
    fontSize: 12,
  },
  latestPreview: {
    color: "#393934",
    fontSize: 13,
    lineHeight: 18,
  },
  viewAllButton: {
    alignItems: "center",
    backgroundColor: "#5f6df5",
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 11,
  },
  viewAllText: {
    color: "#fff",
    fontWeight: "700",
  },
  detailOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    flex: 1,
    justifyContent: "flex-end",
  },
  detailPanel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: "86%",
  },
  detailContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 28,
  },
  detailTitle: {
    color: "#151515",
    fontSize: 22,
    fontWeight: "700",
  },
  detailMeta: {
    color: "#62625c",
    fontSize: 14,
  },
  detailBody: {
    borderColor: "#d7ddff",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  detailText: {
    color: "#222",
    fontSize: 16,
    lineHeight: 23,
  },
});


