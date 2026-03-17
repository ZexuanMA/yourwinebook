import { StyleSheet, Text, View } from "react-native";

export default function CreatePostScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>發帖</Text>
      <Text style={styles.subtitle}>分享你的品酒體驗 — 即將上線</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  title: { fontSize: 24, fontWeight: "700", color: "#2C2C2C" },
  subtitle: { fontSize: 14, color: "#6B6560", marginTop: 8 },
});
