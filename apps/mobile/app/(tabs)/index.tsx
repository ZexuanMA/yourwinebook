import { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import PostCard, { type PostCardData } from "../../components/PostCard";
import { COMMUNITY_EVENTS } from "@ywb/domain";
import { captureEvent } from "../../lib/posthog";

const PAGE_SIZE = 15;

// Skeleton placeholder while loading
function PostSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.authorRow}>
        <View style={skeletonStyles.avatar} />
        <View style={{ gap: 6, flex: 1 }}>
          <View style={[skeletonStyles.bar, { width: "40%" }]} />
          <View style={[skeletonStyles.bar, { width: "25%", height: 10 }]} />
        </View>
      </View>
      <View style={[skeletonStyles.bar, { width: "70%", height: 16 }]} />
      <View style={[skeletonStyles.bar, { width: "100%", marginTop: 8 }]} />
      <View style={[skeletonStyles.bar, { width: "90%", marginTop: 4 }]} />
      <View style={[skeletonStyles.bar, { width: "60%", marginTop: 4 }]} />
      <View style={[skeletonStyles.imagePlaceholder, { marginTop: 10 }]} />
    </View>
  );
}

function SkeletonList() {
  return (
    <View style={styles.container}>
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </View>
  );
}

export default function FeedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const trackedRef = useRef(false);

  const fetchFeed = useCallback(
    async (cursor?: { ts: string; id: string }) => {
      const sb = getSupabase();
      if (!sb) {
        setLoading(false);
        return;
      }

      const params: Record<string, unknown> = {
        p_limit: PAGE_SIZE,
      };
      if (user?.id) params.p_user_id = user.id;
      if (cursor) {
        params.p_cursor_ts = cursor.ts;
        params.p_cursor_id = cursor.id;
      }

      const { data, error } = await sb.rpc("get_feed", params);

      if (error) {
        console.error("[feed] RPC error:", error.message);
        setLoading(false);
        return;
      }

      const rows: PostCardData[] = (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        content: r.content as string,
        title: r.title as string | null,
        tags: (r.tags as string[]) ?? [],
        rating: r.rating as number | null,
        is_official: r.is_official as boolean,
        like_count: r.like_count as number,
        comment_count: r.comment_count as number,
        created_at: r.created_at as string,
        author_id: r.author_id as string,
        author_name: r.author_name as string,
        author_avatar: r.author_avatar as string | null,
        merchant_name: r.merchant_name as string | null,
        media: (r.media as PostCardData["media"]) ?? [],
        products: (r.products as PostCardData["products"]) ?? [],
        is_liked: r.is_liked as boolean,
        is_bookmarked: r.is_bookmarked as boolean,
      }));

      setHasMore(rows.length >= PAGE_SIZE);
      return rows;
    },
    [user?.id],
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchFeed().then((rows) => {
      if (rows) setPosts(rows);
      setLoading(false);

      if (!trackedRef.current) {
        captureEvent(COMMUNITY_EVENTS.FEED_VIEWED);
        trackedRef.current = true;
      }
    });
  }, [fetchFeed]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const rows = await fetchFeed();
    if (rows) setPosts(rows);
    setHasMore(true);
    setRefreshing(false);
  }, [fetchFeed]);

  // Infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    const last = posts[posts.length - 1];
    const rows = await fetchFeed({ ts: last.created_at, id: last.id });
    if (rows) {
      setPosts((prev) => [...prev, ...rows]);
    }
    setLoadingMore(false);
  }, [loadingMore, hasMore, posts, fetchFeed]);

  const handlePostPress = useCallback(
    (post: PostCardData) => {
      captureEvent(COMMUNITY_EVENTS.POST_CARD_CLICKED, { post_id: post.id });
      router.push(`/post/${post.id}`);
    },
    [router],
  );

  const handleLike = useCallback(
    async (post: PostCardData) => {
      const sb = getSupabase();
      if (!sb || !user) return;

      const wasLiked = post.is_liked;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                is_liked: !wasLiked,
                like_count: wasLiked ? p.like_count - 1 : p.like_count + 1,
              }
            : p,
        ),
      );

      try {
        if (wasLiked) {
          const { error } = await sb.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
          if (error) throw error;
          captureEvent(COMMUNITY_EVENTS.POST_UNLIKED, { post_id: post.id });
        } else {
          const { error } = await sb.from("post_likes").insert({ post_id: post.id, user_id: user.id });
          if (error) throw error;
          captureEvent(COMMUNITY_EVENTS.POST_LIKED, { post_id: post.id });
        }
      } catch {
        // Rollback on failure
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  is_liked: wasLiked,
                  like_count: wasLiked ? p.like_count + 1 : p.like_count - 1,
                }
              : p,
          ),
        );
      }
    },
    [user],
  );

  const handleBookmark = useCallback(
    async (post: PostCardData) => {
      const sb = getSupabase();
      if (!sb || !user) return;

      const wasBookmarked = post.is_bookmarked;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_bookmarked: !wasBookmarked } : p,
        ),
      );

      try {
        if (wasBookmarked) {
          const { error } = await sb.from("post_bookmarks").delete().eq("post_id", post.id).eq("user_id", user.id);
          if (error) throw error;
          captureEvent(COMMUNITY_EVENTS.POST_UNBOOKMARKED, { post_id: post.id });
        } else {
          const { error } = await sb.from("post_bookmarks").insert({ post_id: post.id, user_id: user.id });
          if (error) throw error;
          captureEvent(COMMUNITY_EVENTS.POST_BOOKMARKED, { post_id: post.id });
        }
      } catch {
        // Rollback
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, is_bookmarked: wasBookmarked } : p,
          ),
        );
      }
    },
    [user],
  );

  // Loading skeleton
  if (loading) {
    return <SkeletonList />;
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📝</Text>
        <Text style={styles.emptyText}>{t("feed.empty")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => handlePostPress(item)}
          onLike={() => handleLike(item)}
          onComment={() => {
            captureEvent(COMMUNITY_EVENTS.POST_CARD_CLICKED, { post_id: item.id });
            router.push(`/post/${item.id}`);
          }}
          onBookmark={() => handleBookmark(item)}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#5B2E35"
          colors={["#5B2E35"]}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color="#5B2E35" />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF8F5",
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B6560",
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E5E5",
    marginRight: 10,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E5E5E5",
  },
  imagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    backgroundColor: "#E5E5E5",
  },
});
