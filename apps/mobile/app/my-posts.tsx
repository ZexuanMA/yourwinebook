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

export default function MyPostsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) {
      setLoading(false);
      return;
    }

    const { data } = await sb
      .from("posts")
      .select(`
        id, content, title, tags, rating, is_official,
        like_count, comment_count, created_at, status,
        author_id, author:profiles!author_id(display_name, avatar_url),
        media:post_media(id, url, mime_type, width, height),
        products:post_products(wines(slug, name, emoji))
      `)
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setPosts(
        data.map((row: Record<string, unknown>) => {
          const author = row.author as Record<string, string> | null;
          const media = (row.media as Record<string, unknown>[]) ?? [];
          const products = (row.products as Record<string, unknown>[]) ?? [];
          return {
            id: row.id as string,
            content: row.content as string,
            title: row.title as string | null,
            tags: (row.tags as string[]) ?? [],
            rating: row.rating as number | null,
            is_official: row.is_official as boolean,
            like_count: row.like_count as number,
            comment_count: row.comment_count as number,
            created_at: row.created_at as string,
            author_id: row.author_id as string,
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
            is_bookmarked: false,
            _status: row.status as string,
          };
        })
      );
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t("profile.myPosts") }} />
        <ActivityIndicator size="large" color="#5B2E35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("profile.myPosts") }} />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={(item as PostCardData & { _status?: string })._status === "hidden" ? styles.hiddenPost : undefined}>
            <PostCard
              post={item}
              onPress={() => router.push(`/post/${item.id}`)}
            />
            {(item as PostCardData & { _status?: string })._status === "hidden" && (
              <View style={styles.hiddenBadge}>
                <Text style={styles.hiddenBadgeText}>
                  {isZh ? "已隱藏" : "Hidden"}
                </Text>
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B2E35" />
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>
              {isZh ? "還沒有發過帖子，去發一條吧" : "No posts yet — share your first wine experience"}
            </Text>
            <Pressable style={styles.createBtn} onPress={() => router.push("/(tabs)/create")}>
              <Text style={styles.createBtnText}>
                {isZh ? "去發帖" : "Create Post"}
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  listContent: { paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#6B6560", textAlign: "center", marginBottom: 16 },
  createBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  hiddenPost: { opacity: 0.5 },
  hiddenBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#6B6560",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  hiddenBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
});
