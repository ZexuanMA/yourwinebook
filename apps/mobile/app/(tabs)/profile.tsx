import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("profile.title")}</Text>
      <Text style={styles.subtitle}>{t("common.comingSoon")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  title: { fontSize: 24, fontWeight: "700", color: "#2C2C2C" },
  subtitle: { fontSize: 14, color: "#6B6560", marginTop: 8 },
});
