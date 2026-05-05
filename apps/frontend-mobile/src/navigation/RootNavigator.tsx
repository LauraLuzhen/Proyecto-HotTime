import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../state/auth/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { AdministrationScreen } from "../screens/AdministrationScreen";
import { ManagerOnlyScreen } from "../screens/ManagerOnlyScreen";
import { EmployeeOnlyScreen } from "../screens/EmployeeOnlyScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ContactsScreen } from "../screens/ContactsScreen";
import { DrawerContent } from "./drawer/DrawerContent";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{ headerShown: true }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Contacts" component={ContactsScreen} />
      <Drawer.Screen name="Administration" component={AdministrationScreen} />
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

