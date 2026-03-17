import { useLocalSearchParams, router } from "expo-router";
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Deep link target: yourwinebook://post/:id
 * Redirects to the feed tab with the post in focus (P1B-05 will implement full detail view).
 */
export default function PostDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    // TODO P1B-05: navigate to post detail with id
    // For now, redirect to feed
    router.replace("/(tabs)");
  }, [id]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading post…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  text: { fontSize: 14, color: "#6B6560" },
});
