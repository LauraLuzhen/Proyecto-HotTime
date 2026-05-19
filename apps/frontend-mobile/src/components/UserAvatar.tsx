import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  uri?: string | null;
  name?: string;
  size: number;
};

function initials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const first = parts[0]?.[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function UserAvatar({ uri, name, size }: Props) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "#e4e7ff",
  },
  fallback: {
    alignItems: "center",
    backgroundColor: "#c4b5fd",
    justifyContent: "center",
  },
  fallbackText: {
    color: "#fff",
    fontWeight: "700",
  },
});
