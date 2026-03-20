import { useLocalSearchParams, router, Stack } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { getBusinessStatus, type HoursMap, type DayOfWeek } from "@ywb/domain";

const DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

interface StoreDetail {
  id: string;
  merchant_id: string;
  name: string;
  address_zh: string;
  address_en: string | null;
  district_zh: string | null;
  district_en: string | null;
  phone: string | null;
  hours: HoursMap | null;
  is_active: boolean;
  lat: number | null;
  lng: number | null;
  merchant_name: string;
  merchant_slug: string;
}

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const fetchStore = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !id) return;

    setLoading(true);
    try {
      // Fetch store with merchant info
      const { data, error } = await sb
        .from("merchant_locations")
        .select("*, merchants(name, slug)")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.replace("/(tabs)/stores");
        return;
      }

      // Parse location
      let lat: number | null = null;
      let lng: number | null = null;
      if (data.location) {
        const loc =
          typeof data.location === "string"
            ? JSON.parse(data.location)
            : data.location;
        if (loc?.coordinates) {
          lng = loc.coordinates[0];
          lat = loc.coordinates[1];
        }
      }

      const merchant = data.merchants as { name: string; slug: string } | null;

      setStore({
        id: data.id,
        merchant_id: data.merchant_id,
        name: data.name,
        address_zh: data.address_zh,
        address_en: data.address_en,
        district_zh: data.district_zh,
        district_en: data.district_en,
        phone: data.phone,
        hours: data.hours as HoursMap | null,
        is_active: data.is_active,
        lat,
        lng,
        merchant_name: merchant?.name ?? "",
        merchant_slug: merchant?.slug ?? "",
      });

      // Check bookmark
      if (user) {
        const { data: bm } = await sb
          .from("store_bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("location_id", data.id)
          .maybeSingle();
        setIsBookmarked(!!bm);
      }
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const handleBookmark = async () => {
    const sb = getSupabase();
    if (!sb || !user || !store) return;

    if (isBookmarked) {
      await sb
        .from("store_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("location_id", store.id);
    } else {
      await sb
        .from("store_bookmarks")
        .insert({ user_id: user.id, location_id: store.id });
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleNavigate = () => {
    if (!store?.lat || !store?.lng) return;
    const label = encodeURIComponent(store.name);
    const url =
      Platform.OS === "ios"
        ? `maps:0,0?q=${label}@${store.lat},${store.lng}`
        : `geo:${store.lat},${store.lng}?q=${store.lat},${store.lng}(${label})`;
    Linking.openURL(url).catch(() => {
      // Fallback to Google Maps web
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`
      );
    });
  };

  const handleCall = () => {
    if (!store?.phone) return;
    Linking.openURL(`tel:${store.phone}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "" }} />
        <ActivityIndicator size="large" color="#5B2E35" />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "" }} />
        <Text style={styles.errorText}>{t("common.error")}</Text>
      </View>
    );
  }

  const address = isZh
    ? store.address_zh
    : store.address_en || store.address_zh;
  const district = isZh
    ? store.district_zh
    : store.district_en || store.district_zh;
  const now = new Date();
  const { status, closesAt, opensAt } = getBusinessStatus(store.hours, now);
  const isOpen = status === "open" || status === "closing-soon";

  const dayNames: Record<string, string> = {
    mon: isZh ? "一" : "Mon",
    tue: isZh ? "二" : "Tue",
    wed: isZh ? "三" : "Wed",
    thu: isZh ? "四" : "Thu",
    fri: isZh ? "五" : "Fri",
    sat: isZh ? "六" : "Sat",
    sun: isZh ? "日" : "Sun",
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: store.name }} />

      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.merchantName}>{store.merchant_name}</Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              isOpen ? styles.openBadge : styles.closedBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isOpen ? styles.openText : styles.closedText,
              ]}
            >
              {isOpen ? t("stores.open") : t("stores.closed")}
            </Text>
          </View>
          {status === "closing-soon" && closesAt && (
            <Text style={styles.closingSoon}>
              {isZh ? `${closesAt} 關門` : `Closes at ${closesAt}`}
            </Text>
          )}
          {!isOpen && opensAt && (
            <Text style={styles.opensAt}>
              {isZh ? `${opensAt} 開門` : `Opens at ${opensAt}`}
            </Text>
          )}
        </View>
      </View>

      {/* Address */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {isZh ? "地址" : "Address"}
        </Text>
        <Text style={styles.sectionValue}>{address}</Text>
        {district && (
          <Text style={styles.district}>{district}</Text>
        )}
      </View>

      {/* Phone */}
      {store.phone && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isZh ? "電話" : "Phone"}
          </Text>
          <Pressable onPress={handleCall}>
            <Text style={[styles.sectionValue, styles.linkText]}>
              {store.phone}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Business Hours */}
      {store.hours && Object.keys(store.hours).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isZh ? "營業時間" : "Business Hours"}
          </Text>
          {DAYS.map((day) => {
            const dh = store.hours?.[day];
            return (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.dayName}>{dayNames[day]}</Text>
                {dh ? (
                  <Text style={styles.hoursText}>
                    {dh.open} – {dh.close}
                  </Text>
                ) : (
                  <Text style={styles.closedDay}>
                    {isZh ? "休息" : "Closed"}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {store.lat && store.lng && (
          <Pressable style={styles.primaryBtn} onPress={handleNavigate}>
            <Text style={styles.primaryBtnText}>{t("stores.navigate")}</Text>
          </Pressable>
        )}

        {user && (
          <Pressable
            style={[styles.secondaryBtn, isBookmarked && styles.bookmarkedBtn]}
            onPress={handleBookmark}
          >
            <Text
              style={[
                styles.secondaryBtnText,
                isBookmarked && styles.bookmarkedBtnText,
              ]}
            >
              {isBookmarked ? t("stores.unbookmark") : t("stores.bookmark")}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF8F5",
  },
  errorText: {
    fontSize: 14,
    color: "#6B6560",
  },
  headerSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  storeName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  merchantName: {
    fontSize: 14,
    color: "#6B6560",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: "#dcfce7",
  },
  closedBadge: {
    backgroundColor: "#f3f4f6",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  openText: {
    color: "#15803d",
  },
  closedText: {
    color: "#6b7280",
  },
  closingSoon: {
    fontSize: 12,
    color: "#B8956A",
    fontWeight: "500",
  },
  opensAt: {
    fontSize: 12,
    color: "#6B6560",
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6B6560",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 15,
    color: "#2C2C2C",
    lineHeight: 22,
  },
  district: {
    fontSize: 13,
    color: "#6B6560",
    marginTop: 2,
  },
  linkText: {
    color: "#5B2E35",
    textDecorationLine: "underline",
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dayName: {
    fontSize: 14,
    color: "#2C2C2C",
    width: 36,
  },
  hoursText: {
    fontSize: 14,
    color: "#2C2C2C",
  },
  closedDay: {
    fontSize: 14,
    color: "#9ca3af",
  },
  actions: {
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  secondaryBtnText: {
    color: "#5B2E35",
    fontSize: 16,
    fontWeight: "500",
  },
  bookmarkedBtn: {
    borderColor: "#B8956A",
    backgroundColor: "#FFF8F0",
  },
  bookmarkedBtnText: {
    color: "#B8956A",
  },
});
