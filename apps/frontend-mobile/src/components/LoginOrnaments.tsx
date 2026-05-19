import { View, StyleSheet } from "react-native";

import { brandPalette } from "../lib/schedule";

export function LoginOrnaments() {
  return (
    <>
      <View style={styles.ornamentTop} />
      <View style={styles.ornamentBottom} />
    </>
  );
}

const styles = StyleSheet.create({
  ornamentTop: {
    backgroundColor: brandPalette[0],
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
    height: 220,
    opacity: 0.85,
    position: "absolute",
    right: -110,
    top: -70,
    width: 220,
  },
  ornamentBottom: {
    backgroundColor: brandPalette[4],
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    bottom: -110,
    height: 250,
    left: -110,
    opacity: 0.75,
    position: "absolute",
    width: 250,
  },
});
