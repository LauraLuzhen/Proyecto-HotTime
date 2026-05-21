import { NavigationContainer } from "@react-navigation/native";
import { AppAlertProvider } from "./src/components/AppAlert";
import { AuthProvider } from "./src/state/auth/AuthProvider";
import { RootNavigator } from "./src/navigation/RootNavigator";

const linking = {
  prefixes: [
    "hottime://",
    "exp://172.16.0.213:8081",
  ],
  config: {
    screens: {
      Login: "login",
      ForgotPassword: "forgot-password",
      ResetPassword: {
        path: "--/reset-password",
        parse: {
          token: (token: string) => token,
        },
      },
    },
  },
};

export default function App() {
  return (
    <AuthProvider>
      <AppAlertProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </AppAlertProvider>
    </AuthProvider>
  );
}