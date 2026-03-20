import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

export interface StoreCardData {
  id: string;
  merchant_id: string;
  merchant_name: string;
  merchant_slug: string;
  name: string;
  address_zh: string;
  address_en: string | null;
  district_zh: string | null;
  district_en: string | null;
  phone: string | null;
  hours: Record<string, { open: string; close: string }> | null;
  lat: number;
  lng: number;
  distance_m: number;
  is_bookmarked: boolean;
}

interface StoreCardProps {
  store: StoreCardData;
  isOpen?: boolean;
  onPress?: () => void;
  onBookmark?: () => void;
  onNavigate?: () => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export default function StoreCard({
  store,
  isOpen,
  onPress,
  onBookmark,
  onNavigate,
}: StoreCardProps) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");
  const address = isZh ? store.address_zh : (store.address_en || store.address_zh);
  const district = isZh ? store.district_zh : (store.district_en || store.district_zh);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
          {isOpen !== undefined && (
            <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
              <Text style={[styles.statusText, isOpen ? styles.openText : styles.closedText]}>
                {isOpen ? t("stores.open") : t("stores.closed")}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.merchant}>{store.merchant_name}</Text>
      </View>

      <Text style={styles.address} numberOfLines={2}>{address}</Text>
      {district && <Text style={styles.district}>{district}</Text>}

      <View style={styles.footer}>
        <Text style={styles.distance}>{formatDistance(store.distance_m)}</Text>

        <View style={styles.actions}>
          {onBookmark && (
            <Pressable onPress={onBookmark} style={styles.actionBtn} hitSlop={8}>
              <Text style={[styles.actionText, store.is_bookmarked && styles.bookmarked]}>
                {store.is_bookmarked ? t("stores.unbookmark") : t("stores.bookmark")}
              </Text>
            </Pressable>
          )}
          {onNavigate && (
            <Pressable onPress={onNavigate} style={[styles.actionBtn, styles.navBtn]} hitSlop={8}>
              <Text style={styles.navText}>{t("stores.navigate")}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  openBadge: {
    backgroundColor: "#dcfce7",
  },
  closedBadge: {
    backgroundColor: "#f3f4f6",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  openText: {
    color: "#15803d",
  },
  closedText: {
    color: "#6b7280",
  },
  merchant: {
    fontSize: 12,
    color: "#6B6560",
    marginTop: 2,
  },
  address: {
    fontSize: 13,
    color: "#4B4B4B",
    lineHeight: 18,
  },
  district: {
    fontSize: 12,
    color: "#6B6560",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  distance: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B2E35",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  actionText: {
    fontSize: 12,
    color: "#6B6560",
  },
  bookmarked: {
    color: "#B8956A",
    fontWeight: "600",
  },
  navBtn: {
    backgroundColor: "#5B2E35",
    borderColor: "#5B2E35",
  },
  navText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
