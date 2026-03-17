import { StyleSheet, Text, View } from "react-native";

export default function StoresScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>找店</Text>
      <Text style={styles.subtitle}>附近門店 — 即將上線</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  title: { fontSize: 24, fontWeight: "700", color: "#2C2C2C" },
  subtitle: { fontSize: 14, color: "#6B6560", marginTop: 8 },
});
