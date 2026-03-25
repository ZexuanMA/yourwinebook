import { useCallback, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import PostCard, { type PostCardData } from "../components/PostCard";

type Tab = "posts" | "wines" | "stores";

interface WineBookmark {
  slug: string;
  name: string;
  emoji: string;
  type: string;
  region_en: string;
  min_price: number;
}

interface StoreBookmark {
  id: string;
  name_zh: string;
  name_en: string;
  address_zh: string;
  address_en: string;
}

export default function BookmarksScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [wines, setWines] = useState<WineBookmark[]>([]);
  const [stores, setStores] = useState<StoreBookmark[]>([]);

  const fetchBookmarks = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) {
      setLoading(false);
      return;
    }

    // Fetch all three in parallel
    const [postsRes, winesRes, storesRes] = await Promise.all([
      sb
        .from("post_bookmarks")
        .select(`
          posts(
            id, content, title, tags, rating, is_official,
            like_count, comment_count, created_at, status,
            author_id, author:profiles!author_id(display_name, avatar_url),
            media:post_media(id, url, mime_type, width, height),
            products:post_products(wines(slug, name, emoji))
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      sb
        .from("wine_bookmarks")
        .select("wines(slug, name, emoji, type, region_en, min_price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      sb
        .from("store_bookmarks")
        .select("merchant_locations(id, name_zh, name_en, address_zh, address_en)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    // Parse posts
    if (postsRes.data) {
      setPosts(
        postsRes.data
          .map((row: Record<string, unknown>) => {
            const post = row.posts as Record<string, unknown> | null;
            if (!post || (post.status as string) !== "visible") return null;
            const author = post.author as Record<string, string> | null;
            const media = (post.media as Record<string, unknown>[]) ?? [];
            const products = (post.products as Record<string, unknown>[]) ?? [];
            return {
              id: post.id as string,
              content: post.content as string,
              title: post.title as string | null,
              tags: (post.tags as string[]) ?? [],
              rating: post.rating as number | null,
              is_official: post.is_official as boolean,
              like_count: post.like_count as number,
              comment_count: post.comment_count as number,
              created_at: post.created_at as string,
              author_id: post.author_id as string,
              author_name: author?.display_name ?? "",
              author_avatar: author?.avatar_url ?? null,
              merchant_name: null,
              media: media.map((m: Record<string, unknown>) => ({
                id: m.id as string,
                url: m.url as string,
                mime_type: m.mime_type as string,
                width: m.width as number | null,
                height: m.height as number | null,
              })),
              products: products.map((p: Record<string, unknown>) => {
                const wine = p.wines as Record<string, string> | null;
                return {
                  slug: wine?.slug ?? "",
                  name: wine?.name ?? "",
                  emoji: wine?.emoji ?? "",
                };
              }),
              is_liked: false,
              is_bookmarked: true,
            } as PostCardData;
          })
          .filter(Boolean) as PostCardData[]
      );
    }

    // Parse wines
    if (winesRes.data) {
      setWines(
        winesRes.data
          .map((row: Record<string, unknown>) => {
            const wine = row.wines as Record<string, unknown> | null;
            if (!wine) return null;
            return {
              slug: wine.slug as string,
              name: wine.name as string,
              emoji: wine.emoji as string,
              type: wine.type as string,
              region_en: wine.region_en as string,
              min_price: wine.min_price as number,
            };
          })
          .filter(Boolean) as WineBookmark[]
      );
    }

    // Parse stores
    if (storesRes.data) {
      setStores(
        storesRes.data
          .map((row: Record<string, unknown>) => {
            const loc = row.merchant_locations as Record<string, unknown> | null;
            if (!loc) return null;
            return {
              id: loc.id as string,
              name_zh: loc.name_zh as string,
              name_en: loc.name_en as string,
              address_zh: loc.address_zh as string,
              address_en: loc.address_en as string,
            };
          })
          .filter(Boolean) as StoreBookmark[]
      );
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookmarks();
    setRefreshing(false);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "posts", label: isZh ? "帖子" : "Posts" },
    { key: "wines", label: isZh ? "酒款" : "Wines" },
    { key: "stores", label: isZh ? "門店" : "Stores" },
  ];

  const emptyText: Record<Tab, string> = {
    posts: isZh ? "還沒有收藏帖子" : "No bookmarked posts",
    wines: isZh ? "還沒有收藏酒款" : "No bookmarked wines",
    stores: isZh ? "還沒有收藏門店" : "No bookmarked stores",
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t("profile.bookmarks") }} />
        <ActivityIndicator size="large" color="#5B2E35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("profile.bookmarks") }} />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tb) => (
          <Pressable
            key={tb.key}
            style={[styles.tab, tab === tb.key && styles.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[styles.tabText, tab === tb.key && styles.tabTextActive]}>
              {tb.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {tab === "posts" && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => router.push(`/post/${item.id}`)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2E35" />}
          contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<EmptyState text={emptyText.posts} />}
        />
      )}

      {tab === "wines" && (
        <FlatList
          data={wines}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => (
            <Pressable style={styles.wineRow} onPress={() => {/* TODO: navigate to wine detail */}}>
              <Text style={styles.wineEmoji}>{item.emoji}</Text>
              <View style={styles.wineInfo}>
                <Text style={styles.wineName}>{item.name}</Text>
                <Text style={styles.wineRegion}>{item.region_en}</Text>
              </View>
              <Text style={styles.winePrice}>HK${item.min_price}</Text>
            </Pressable>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2E35" />}
          contentContainerStyle={wines.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<EmptyState text={emptyText.wines} />}
        />
      )}

      {tab === "stores" && (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.storeRow} onPress={() => router.push(`/store/${item.id}`)}>
              <Text style={styles.storeEmoji}>📍</Text>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>
                  {isZh ? item.name_zh : item.name_en}
                </Text>
                <Text style={styles.storeAddress} numberOfLines={1}>
                  {isZh ? item.address_zh : item.address_en}
                </Text>
              </View>
              <Text style={styles.storeArrow}>›</Text>
            </Pressable>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2E35" />}
          contentContainerStyle={stores.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<EmptyState text={emptyText.stores} />}
        />
      )}
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🔖</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#5B2E35",
  },
  tabText: {
    fontSize: 14,
    color: "#6B6560",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#5B2E35",
    fontWeight: "600",
  },
  listContent: { paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#6B6560", textAlign: "center" },
  // Wine rows
  wineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F0EB",
  },
  wineEmoji: { fontSize: 28, marginRight: 12 },
  wineInfo: { flex: 1 },
  wineName: { fontSize: 15, fontWeight: "600", color: "#2C2C2C" },
  wineRegion: { fontSize: 12, color: "#6B6560", marginTop: 2 },
  winePrice: { fontSize: 15, fontWeight: "700", color: "#5B2E35" },
  // Store rows
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F0EB",
  },
  storeEmoji: { fontSize: 20, marginRight: 12 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: 15, fontWeight: "600", color: "#2C2C2C" },
  storeAddress: { fontSize: 12, color: "#6B6560", marginTop: 2 },
  storeArrow: { fontSize: 18, color: "#9CA3AF" },
});
