import { StyleSheet, View } from "react-native";

import { brandPalette } from "../lib/schedule";

export function BrandBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, styles.topLeft, { backgroundColor: brandPalette[0] }]} />
      <View style={[styles.blob, styles.topRight, { backgroundColor: brandPalette[1] }]} />
      <View style={[styles.blob, styles.bottomLeft, { backgroundColor: brandPalette[3] }]} />
      <View style={[styles.blob, styles.bottomRight, { backgroundColor: brandPalette[4] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    borderRadius: 999,
    opacity: 0.38,
    position: "absolute",
  },
  topLeft: {
    height: 180,
    left: -70,
    top: -50,
    width: 180,
  },
  topRight: {
    height: 140,
    right: -40,
    top: 20,
    width: 140,
  },
  bottomLeft: {
    bottom: 40,
    height: 160,
    left: -50,
    width: 160,
  },
  bottomRight: {
    bottom: -40,
    height: 200,
    right: -70,
    width: 200,
  },
});
