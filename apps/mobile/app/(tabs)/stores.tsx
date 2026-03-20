import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { getSupabase } from "../../lib/supabase";
import { useLocation } from "../../hooks/useLocation";
import { useAuth } from "../../providers/AuthProvider";
import StoreCard, { type StoreCardData } from "../../components/StoreCard";
import { HK_DISTRICTS, type District, getBusinessStatus, type HoursMap, STORE_EVENTS } from "@ywb/domain";
import { captureEvent } from "../../lib/posthog";

type ViewMode = "location" | "district";

export default function StoresScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const location = useLocation();
  const isZh = i18n.language.startsWith("zh");

  const [viewMode, setViewMode] = useState<ViewMode>("location");
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [stores, setStores] = useState<StoreCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStores = useCallback(
    async (lat: number, lng: number) => {
      const sb = getSupabase();
      if (!sb) return;

      setLoading(true);
      try {
        const { data, error } = await sb.rpc("get_nearby_stores", {
          p_lat: lat,
          p_lng: lng,
          p_user_id: user?.id ?? undefined,
        });

        if (error) {
          console.error("[stores] RPC error:", error.message);
          return;
        }
        const storeList = (data as StoreCardData[]) ?? [];
        setStores(storeList);
        captureEvent(STORE_EVENTS.STORE_LIST_VIEWED, { count: storeList.length, mode: viewMode });
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Track location permission changes
  useEffect(() => {
    if (location.status === "granted") {
      captureEvent(STORE_EVENTS.LOCATION_PERMISSION_GRANTED);
    } else if (location.status === "denied") {
      captureEvent(STORE_EVENTS.LOCATION_PERMISSION_DENIED);
    }
  }, [location.status]);

  // Auto-fetch when location available
  useEffect(() => {
    if (viewMode === "location" && location.hasCoords) {
      fetchStores(location.latitude!, location.longitude!);
    }
  }, [viewMode, location.hasCoords, location.latitude, location.longitude, fetchStores]);

  // Fetch when district selected
  useEffect(() => {
    if (viewMode === "district" && selectedDistrict) {
      fetchStores(selectedDistrict.lat, selectedDistrict.lng);
    }
  }, [viewMode, selectedDistrict, fetchStores]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === "location" && location.hasCoords) {
      await fetchStores(location.latitude!, location.longitude!);
    } else if (viewMode === "district" && selectedDistrict) {
      await fetchStores(selectedDistrict.lat, selectedDistrict.lng);
    }
    setRefreshing(false);
  }, [viewMode, location, selectedDistrict, fetchStores]);

  const handleStorePress = (store: StoreCardData) => {
    captureEvent(STORE_EVENTS.STORE_CARD_CLICKED, { store_id: store.id, merchant_slug: store.merchant_slug });
    router.push(`/store/${store.id}`);
  };

  const handleBookmark = async (store: StoreCardData) => {
    const sb = getSupabase();
    if (!sb || !user) return;

    if (store.is_bookmarked) {
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

    captureEvent(store.is_bookmarked ? STORE_EVENTS.STORE_UNBOOKMARKED : STORE_EVENTS.STORE_BOOKMARKED, {
      store_id: store.id,
      merchant_slug: store.merchant_slug,
    });

    // Optimistic toggle
    setStores((prev) =>
      prev.map((s) =>
        s.id === store.id ? { ...s, is_bookmarked: !s.is_bookmarked } : s
      )
    );
  };

  // ─── Location Permission Screen ─────────────────────────
  if (location.status === "idle" || location.status === "requesting") {
    return (
      <View style={styles.center}>
        {location.status === "requesting" ? (
          <>
            <ActivityIndicator size="large" color="#5B2E35" />
            <Text style={styles.loadingText}>{t("stores.loading")}</Text>
          </>
        ) : (
          <>
            <Text style={styles.heroTitle}>{t("stores.locationTitle")}</Text>
            <Text style={styles.heroDesc}>{t("stores.locationDesc")}</Text>
            <Pressable style={styles.primaryBtn} onPress={() => {
              captureEvent(STORE_EVENTS.LOCATION_PERMISSION_REQUESTED);
              location.requestLocation();
            }}>
              <Text style={styles.primaryBtnText}>{t("stores.locationButton")}</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setViewMode("district")}
            >
              <Text style={styles.secondaryBtnText}>{t("stores.selectDistrict")}</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  // ─── Location Denied → District Selection ────────────────
  if (location.status === "denied" && viewMode === "location") {
    return (
      <View style={styles.center}>
        <Text style={styles.heroTitle}>{t("stores.locationDenied")}</Text>
        <Text style={styles.heroDesc}>{t("stores.locationDeniedDesc")}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => setViewMode("district")}>
          <Text style={styles.primaryBtnText}>{t("stores.selectDistrict")}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={location.requestLocation}>
          <Text style={styles.secondaryBtnText}>{t("stores.locationRetry")}</Text>
        </Pressable>
      </View>
    );
  }

  // ─── District Picker ─────────────────────────────────────
  if (viewMode === "district" && !selectedDistrict) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.districtList}>
        <Text style={styles.sectionTitle}>{t("stores.selectDistrict")}</Text>
        {HK_DISTRICTS.map((d) => (
          <Pressable
            key={d.slug}
            style={styles.districtItem}
            onPress={() => setSelectedDistrict(d)}
          >
            <Text style={styles.districtName}>
              {isZh ? d.name_zh : d.name_en}
            </Text>
          </Pressable>
        ))}
        {location.status !== "denied" && (
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => {
              setViewMode("location");
              location.requestLocation();
            }}
          >
            <Text style={styles.secondaryBtnText}>{t("stores.locationButton")}</Text>
          </Pressable>
        )}
      </ScrollView>
    );
  }

  // ─── Store List ──────────────────────────────────────────
  const now = new Date();

  return (
    <View style={styles.container}>
      {/* Header with mode toggle */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          {viewMode === "district" && selectedDistrict
            ? isZh ? selectedDistrict.name_zh : selectedDistrict.name_en
            : t("stores.nearby")}
        </Text>
        {viewMode === "district" && (
          <Pressable onPress={() => setSelectedDistrict(null)}>
            <Text style={styles.changeDistrict}>{t("stores.selectDistrict")}</Text>
          </Pressable>
        )}
      </View>

      {loading && stores.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B2E35" />
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const { status } = getBusinessStatus(item.hours as HoursMap, now);
            return (
              <StoreCard
                store={item}
                isOpen={status === "open" || status === "closing-soon"}
                onPress={() => handleStorePress(item)}
                onBookmark={user ? () => handleBookmark(item) : undefined}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#5B2E35"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t("stores.noStores")}</Text>
            </View>
          }
        />
      )}
    </View>
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
    paddingHorizontal: 32,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C2C2C",
    textAlign: "center",
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: "#6B6560",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#5B2E35",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },
  secondaryBtnText: {
    color: "#5B2E35",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B6560",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C2C2C",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  changeDistrict: {
    fontSize: 13,
    color: "#5B2E35",
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 24,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B6560",
  },
  districtList: {
    paddingBottom: 24,
  },
  districtItem: {
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  districtName: {
    fontSize: 16,
    color: "#2C2C2C",
    fontWeight: "500",
  },
});
