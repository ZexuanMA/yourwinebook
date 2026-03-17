import { useLocalSearchParams, router } from "expo-router";
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Deep link target: yourwinebook://store/:id
 * Redirects to the stores tab (P1A-10 will implement full detail view).
 */
export default function StoreDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    // TODO P1A-10: navigate to store detail with id
    router.replace("/(tabs)/stores");
  }, [id]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading store…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  text: { fontSize: 14, color: "#6B6560" },
});
