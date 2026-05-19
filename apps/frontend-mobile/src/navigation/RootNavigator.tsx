import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../state/auth/AuthContext";
import { LoginScreen } from "../screens/common/LoginScreen";
import { DashboardScreen } from "../screens/common/DashboardScreen";
import { AdministrationScreen } from "../screens/high/AdministrationScreen";
import { ProfileScreen } from "../screens/common/ProfileScreen";
import { ContactsScreen } from "../screens/common/ContactsScreen";
import { DrawerContent } from "./drawer/DrawerContent";
import { SendCommunicationScreen } from "../screens/medium/SendCommunicationScreen";
import { BandejaScreen } from "../screens/common/BandejaScreen";
import { OrganizationScreen } from "../screens/high/OrganizationScreen";
import { PlanSchedulesScreen } from "../screens/medium/PlanSchedulesScreen";
import { PlanAttendanceScreen } from "../screens/medium/PlanAttendanceScreen";
import { MyScheduleScreen } from "../screens/common/MyScheduleScreen";
import { MyAttendanceScreen } from "../screens/common/MyAttendanceScreen";
import { HeaderInboxButton } from "./HeaderInboxButton";
import { palette } from "../lib/schedule";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

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
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
      <Drawer.Screen name="Contacts" component={ContactsScreen} options={{ title: "Contactos" }} />
      <Drawer.Screen name="Administration" component={AdministrationScreen} options={{ title: "Administración" }} />
      <Drawer.Screen name="Communication" component={SendCommunicationScreen} options={{ title: "Enviar comunicado" }} />
      <Drawer.Screen name="PlanSchedules" component={PlanSchedulesScreen} options={{ title: "Horarios" }} />
      <Drawer.Screen name="Bandeja" component={BandejaScreen} options={{ title: "Bandeja" }} />
      <Drawer.Screen name="Organization" component={OrganizationScreen} options={{ title: "Organización" }} />
      <Drawer.Screen name="MySchedule" component={MyScheduleScreen} options={{ title: "Mi horario" }} />
      <Drawer.Screen name="MyAttendance" component={MyAttendanceScreen} options={{ title: "Mis fichajes" }} />
      <Drawer.Screen name="PlanAttendance" component={PlanAttendanceScreen} options={{ title: "Fichajes" }} />
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
