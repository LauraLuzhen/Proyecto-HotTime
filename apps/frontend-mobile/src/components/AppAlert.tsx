import { createContext, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "../lib/schedule";

export type AppAlertButtonStyle = "default" | "cancel" | "destructive";

export interface AppAlertButton {
  text: string;
  style?: AppAlertButtonStyle;
  onPress?: () => void;
}

export interface AppAlertOptions {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
}

interface AppAlertContextValue {
  showAlert: (options: AppAlertOptions) => void;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function useAppAlert() {
  const ctx = useContext(AppAlertContext);
  if (!ctx) throw new Error("useAppAlert must be used within AppAlertProvider");
  return ctx;
}

function buttonStyles(style: AppAlertButtonStyle | undefined) {
  switch (style) {
    case "cancel":
      return styles.cancelButton;
    case "destructive":
      return styles.destructiveButton;
    default:
      return styles.primaryButton;
  }
}

function textStyles(style: AppAlertButtonStyle | undefined) {
  switch (style) {
    case "cancel":
      return styles.cancelText;
    case "destructive":
      return styles.destructiveText;
    default:
      return styles.primaryText;
  }
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AppAlertOptions | null>(null);

  const value = useMemo<AppAlertContextValue>(() => ({
    showAlert: (options) => setAlert(options),
  }), []);

  const buttons = alert?.buttons?.length
    ? alert.buttons
    : [{ text: "Aceptar" }];

  function closeAlert() {
    setAlert(null);
  }

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      <Modal transparent animationType="fade" visible={alert !== null} onRequestClose={closeAlert}>
        <Pressable style={styles.overlay} onPress={closeAlert}>
          <Pressable style={styles.card} onPress={() => null}>
            <Text style={styles.title}>{alert?.title}</Text>
            {alert?.message ? <Text style={styles.message}>{alert.message}</Text> : null}
            <View style={styles.buttonRow}>
              {buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  style={({ pressed }) => [
                    styles.button,
                    buttonStyles(button.style),
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    closeAlert();
                    button.onPress?.();
                  }}
                >
                  <Text style={[styles.buttonText, textStyles(button.style)]}>{button.text}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(16, 24, 48, 0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 8,
    gap: 14,
    maxWidth: 420,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    width: "100%",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: palette.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: palette.accentStrong,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "900",
  },
  message: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  buttonRow: {
    gap: 8,
    marginTop: 4,
  },
  button: {
    alignItems: "center",
    borderRadius: 14,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  primaryButton: {
    backgroundColor: palette.accent,
  },
  cancelButton: {
    backgroundColor: palette.backgroundSoft,
    borderColor: palette.border,
    borderWidth: 1,
  },
  destructiveButton: {
    backgroundColor: palette.danger,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  primaryText: {
    color: "#fff",
  },
  cancelText: {
    color: palette.text,
  },
  destructiveText: {
    color: "#fff",
  },
});
