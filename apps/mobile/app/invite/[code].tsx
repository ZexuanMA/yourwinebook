import { useLocalSearchParams, router } from "expo-router";
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Deep link target: yourwinebook://invite/:code
 * Redirects to the feed tab (P2 will implement invite acceptance flow).
 */
export default function InviteDeepLink() {
  const { code } = useLocalSearchParams<{ code: string }>();

  useEffect(() => {
    // TODO P2: handle invite code acceptance
    router.replace("/(tabs)");
  }, [code]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Processing invite…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  text: { fontSize: 14, color: "#6B6560" },
});
