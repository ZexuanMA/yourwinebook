import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useTranslation } from "react-i18next";

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

export interface PostCardData {
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

interface PostCardProps {
  post: PostCardData;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onBookmark?: () => void;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

function getInitial(name: string | null): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

function renderMediaGrid(media: MediaItem[]) {
  if (media.length === 0) return null;

  if (media.length === 1) {
    return (
      <Image
        source={{ uri: media[0].url }}
        style={styles.singleImage}
        resizeMode="cover"
      />
    );
  }

  // 2-4 images: 2-column grid
  const rows = [];
  for (let i = 0; i < Math.min(media.length, 4); i += 2) {
    rows.push(
      <View key={i} style={styles.imageRow}>
        <Image source={{ uri: media[i].url }} style={styles.gridImage} resizeMode="cover" />
        {media[i + 1] && (
          <Image source={{ uri: media[i + 1].url }} style={styles.gridImage} resizeMode="cover" />
        )}
      </View>
    );
  }

  return <View style={styles.imageGrid}>{rows}</View>;
}

export default function PostCard({ post, onPress, onLike, onComment, onBookmark }: PostCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Author Row */}
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
          <Text style={styles.timeText}>{relativeTime(post.created_at)}</Text>
        </View>
      </View>

      {/* Title */}
      {post.title && (
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
      )}

      {/* Content */}
      <Text style={styles.content} numberOfLines={4}>{post.content}</Text>

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.slice(0, 3).map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rating */}
      {post.rating && (
        <Text style={styles.ratingText}>
          {"★".repeat(post.rating)}{"☆".repeat(5 - post.rating)}
        </Text>
      )}

      {/* Media */}
      {renderMediaGrid(post.media)}

      {/* Products */}
      {post.products.length > 0 && (
        <View style={styles.productsRow}>
          {post.products.slice(0, 2).map((p, i) => (
            <View key={i} style={styles.productChip}>
              <Text style={styles.productText}>{p.emoji} {p.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.footerBtn} onPress={onLike} hitSlop={8}>
          <Text style={[styles.footerText, post.is_liked && styles.liked]}>
            {post.is_liked ? "❤️" : "🤍"} {post.like_count || ""}
          </Text>
        </Pressable>
        <Pressable style={styles.footerBtn} onPress={onComment} hitSlop={8}>
          <Text style={styles.footerText}>
            💬 {post.comment_count || ""}
          </Text>
        </Pressable>
        <Pressable style={styles.footerBtn} onPress={onBookmark} hitSlop={8}>
          <Text style={[styles.footerText, post.is_bookmarked && styles.bookmarked]}>
            {post.is_bookmarked ? "🔖" : "📑"}
          </Text>
        </Pressable>
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
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    color: "#4B4B4B",
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: "#F3F0EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#6B6560",
  },
  ratingText: {
    fontSize: 14,
    color: "#B8956A",
    marginBottom: 8,
  },
  singleImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageGrid: {
    gap: 4,
    marginBottom: 8,
  },
  imageRow: {
    flexDirection: "row",
    gap: 4,
  },
  gridImage: {
    flex: 1,
    height: 140,
    borderRadius: 6,
  },
  productsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  productChip: {
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "#B8956A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productText: {
    fontSize: 12,
    color: "#5B2E35",
  },
  footer: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  footerBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#6B6560",
  },
  liked: {
    color: "#E11D48",
  },
  bookmarked: {
    color: "#B8956A",
  },
});
