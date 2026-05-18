import { NavigationContainer } from "@react-navigation/native";

import { AppAlertProvider } from "./src/components/AppAlert";
import { AuthProvider } from "./src/state/auth/AuthProvider";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <AppAlertProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AppAlertProvider>
    </AuthProvider>
  );
}

