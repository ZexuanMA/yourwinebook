import { useLocalSearchParams, router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import ImagePreview, { type PreviewImage } from "../../components/ImagePreview";
import CommentSection from "../../components/CommentSection";
import { COMMUNITY_EVENTS } from "@ywb/domain";
import { captureEvent } from "../../lib/posthog";

interface MediaItem {
  id: string;
  url: string;
  mime_type: string;
  width: number | null;
  height: number | null;
}

interface ProductItem {
  slug: string;
  name: string;
  emoji: string;
}

interface PostDetail {
  id: string;
  content: string;
  title: string | null;
  tags: string[];
  rating: number | null;
  is_official: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  merchant_name: string | null;
  media: MediaItem[];
  products: ProductItem[];
  is_liked: boolean;
  is_bookmarked: boolean;
}

function formatDate(dateStr: string, isZh: boolean): string {
  const d = new Date(dateStr);
  if (isZh) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitial(name: string | null): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(-1);

  const fetchPost = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !id) return;

    setLoading(true);
    try {
      // Use get_feed RPC with a single post filter is not available,
      // so fetch directly from tables
      const { data: postRow, error } = await sb
        .from("posts")
        .select("*, profiles!posts_author_id_fkey(id, display_name, avatar_url), merchants(name)")
        .eq("id", id)
        .eq("status", "visible")
        .single();

      if (error || !postRow) {
        router.back();
        return;
      }

      // Fetch media
      const { data: mediaRows } = await sb
        .from("post_media")
        .select("id, url, mime_type, width, height")
        .eq("post_id", id)
        .order("sort_order");

      // Fetch products
      const { data: productRows } = await sb
        .from("post_products")
        .select("wines(slug, name, emoji)")
        .eq("post_id", id);

      // Check like/bookmark status
      let isLiked = false;
      let isBookmarked = false;
      if (user) {
        const [likeRes, bmRes] = await Promise.all([
          sb.from("post_likes").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
          sb.from("post_bookmarks").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
        ]);
        isLiked = !!likeRes.data;
        isBookmarked = !!bmRes.data;
      }

      const profile = postRow.profiles as { id: string; display_name: string; avatar_url: string | null } | null;
      const merchant = postRow.merchants as { name: string } | null;
      const products: ProductItem[] = (productRows ?? [])
        .map((r: Record<string, unknown>) => r.wines as ProductItem | null)
        .filter(Boolean) as ProductItem[];

      setPost({
        id: postRow.id,
        content: postRow.content,
        title: postRow.title ?? null,
        tags: postRow.tags ?? [],
        rating: postRow.rating ?? null,
        is_official: postRow.is_official,
        like_count: postRow.like_count,
        comment_count: postRow.comment_count,
        created_at: postRow.created_at,
        author_id: profile?.id ?? postRow.author_id,
        author_name: profile?.display_name ?? "",
        author_avatar: profile?.avatar_url ?? null,
        merchant_name: merchant?.name ?? null,
        media: mediaRows ?? [],
        products,
        is_liked: isLiked,
        is_bookmarked: isBookmarked,
      });

      captureEvent(COMMUNITY_EVENTS.POST_DETAIL_VIEWED, { post_id: id });
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    const sb = getSupabase();
    if (!sb || !user || !post) return;

    const wasLiked = post.is_liked;

    // Optimistic update
    setPost((prev) =>
      prev
        ? {
            ...prev,
            is_liked: !wasLiked,
            like_count: wasLiked ? prev.like_count - 1 : prev.like_count + 1,
          }
        : prev,
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
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked: wasLiked,
              like_count: wasLiked ? prev.like_count + 1 : prev.like_count - 1,
            }
          : prev,
      );
    }
  };

  const handleBookmark = async () => {
    const sb = getSupabase();
    if (!sb || !user || !post) return;

    const wasBookmarked = post.is_bookmarked;

    // Optimistic update
    setPost((prev) => (prev ? { ...prev, is_bookmarked: !wasBookmarked } : prev));

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
      // Rollback on failure
      setPost((prev) => (prev ? { ...prev, is_bookmarked: wasBookmarked } : prev));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "" }} />
        <ActivityIndicator size="large" color="#5B2E35" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "" }} />
        <Text style={styles.errorText}>{t("common.error")}</Text>
      </View>
    );
  }

  const previewImages: PreviewImage[] = post.media.map((m) => ({
    id: m.id,
    url: m.url,
    width: m.width,
    height: m.height,
  }));

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "" }} />

      {/* Author */}
      <View style={styles.authorRow}>
        {post.author_avatar ? (
          <Image source={{ uri: post.author_avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{getInitial(post.author_name)}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{post.author_name}</Text>
            {post.is_official && post.merchant_name && (
              <View style={styles.officialBadge}>
                <Text style={styles.officialText}>{post.merchant_name}</Text>
              </View>
            )}
          </View>
          <Text style={styles.timeText}>{formatDate(post.created_at, isZh)}</Text>
        </View>
      </View>

      {/* Title */}
      {post.title && <Text style={styles.title}>{post.title}</Text>}

      {/* Content — no truncation in detail */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rating */}
      {post.rating != null && post.rating > 0 && (
        <Text style={styles.ratingText}>
          {"★".repeat(post.rating)}{"☆".repeat(5 - post.rating)}
        </Text>
      )}

      {/* Media — tappable for preview */}
      {post.media.length > 0 && (
        <View style={styles.mediaSection}>
          {post.media.map((m, i) => (
            <Pressable key={m.id} onPress={() => setPreviewIndex(i)}>
              <Image
                source={{ uri: m.url }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </View>
      )}

      {/* Products */}
      {post.products.length > 0 && (
        <View style={styles.productsRow}>
          {post.products.map((p, i) => (
            <View key={i} style={styles.productChip}>
              <Text style={styles.productText}>
                {p.emoji} {p.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action bar */}
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={handleLike} hitSlop={8}>
          <Text style={[styles.actionText, post.is_liked && styles.liked]}>
            {post.is_liked ? "❤️" : "🤍"} {post.like_count || ""}
          </Text>
          <Text style={[styles.actionLabel, post.is_liked && styles.liked]}>
            {t("feed.like")}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} hitSlop={8}>
          <Text style={styles.actionText}>💬 {post.comment_count || ""}</Text>
          <Text style={styles.actionLabel}>{t("feed.comment")}</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleBookmark} hitSlop={8}>
          <Text style={[styles.actionText, post.is_bookmarked && styles.bookmarked]}>
            {post.is_bookmarked ? "🔖" : "📑"}
          </Text>
          <Text style={[styles.actionLabel, post.is_bookmarked && styles.bookmarked]}>
            {post.is_bookmarked ? t("stores.unbookmark") : t("stores.bookmark")}
          </Text>
        </Pressable>
      </View>

      {/* Comments */}
      <CommentSection
        postId={post.id}
        commentCount={post.comment_count}
        onCommentCountChange={(delta) =>
          setPost((prev) =>
            prev ? { ...prev, comment_count: prev.comment_count + delta } : prev,
          )
        }
      />

      <View style={{ height: 40 }} />

      {/* Image Preview Modal */}
      <ImagePreview
        images={previewImages}
        initialIndex={previewIndex >= 0 ? previewIndex : 0}
        visible={previewIndex >= 0}
        onClose={() => setPreviewIndex(-1)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
    padding: 16,
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
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarFallback: {
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  officialBadge: {
    backgroundColor: "#5B2E35",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  officialText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 8,
  },
  content: {
    fontSize: 15,
    color: "#4B4B4B",
    lineHeight: 24,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#F3F0EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 13,
    color: "#6B6560",
  },
  ratingText: {
    fontSize: 16,
    color: "#B8956A",
    marginBottom: 10,
  },
  mediaSection: {
    gap: 8,
    marginBottom: 12,
  },
  mediaImage: {
    width: "100%",
    height: 260,
    borderRadius: 10,
  },
  productsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  productChip: {
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "#B8956A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  productText: {
    fontSize: 13,
    color: "#5B2E35",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    marginVertical: 12,
  },
  actionBtn: {
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: 18,
    color: "#6B6560",
  },
  actionLabel: {
    fontSize: 12,
    color: "#6B6560",
  },
  liked: {
    color: "#E11D48",
  },
  bookmarked: {
    color: "#B8956A",
  },
});
