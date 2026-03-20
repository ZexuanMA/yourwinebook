import { useLocalSearchParams, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import { useBlockList } from "../../hooks/useBlockList";
import PostCard, { type PostCardData } from "../../components/PostCard";
import { COMMUNITY_EVENTS } from "@ywb/domain";
import { captureEvent } from "../../lib/posthog";

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  post_count: number;
  follower_count: number;
  following_count: number;
}

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : "?";
}

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");
  const { isBlocked, blockUser, unblockUser } = useBlockList();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = user?.id === userId;

  const fetchProfile = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !userId) return;

    setLoading(true);

    const { data: profileData } = await sb
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .eq("id", userId)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    // Counts
    const [postRes, followerRes, followingRes] = await Promise.all([
      sb.from("posts").select("id", { count: "exact", head: true }).eq("author_id", userId).eq("status", "visible"),
      sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", userId),
      sb.from("follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", userId),
    ]);

    setProfile({
      ...profileData,
      post_count: postRes.count ?? 0,
      follower_count: followerRes.count ?? 0,
      following_count: followingRes.count ?? 0,
    });

    // Check if current user follows this user
    if (user && !isOwnProfile) {
      const { data: followRow } = await sb
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("followed_id", userId)
        .maybeSingle();
      setIsFollowing(!!followRow);
    }

    // Fetch user's posts
    const { data: userPosts } = await sb
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(id, display_name, avatar_url), merchants(name)")
      .eq("author_id", userId)
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .limit(20);

    if (userPosts) {
      const mapped: PostCardData[] = userPosts.map((p: Record<string, unknown>) => {
        const authorProfile = p.profiles as { id: string; display_name: string; avatar_url: string | null } | null;
        const merchant = p.merchants as { name: string } | null;
        return {
          id: p.id as string,
          content: p.content as string,
          title: (p.title as string) ?? null,
          tags: (p.tags as string[]) ?? [],
          rating: (p.rating as number) ?? null,
          is_official: p.is_official as boolean,
          like_count: p.like_count as number,
          comment_count: p.comment_count as number,
          created_at: p.created_at as string,
          author_id: authorProfile?.id ?? (p.author_id as string),
          author_name: authorProfile?.display_name ?? "",
          author_avatar: authorProfile?.avatar_url ?? null,
          merchant_name: merchant?.name ?? null,
          media: [],
          products: [],
          is_liked: false,
          is_bookmarked: false,
        };
      });
      setPosts(mapped);
    }

    setLoading(false);
  }, [userId, user, isOwnProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    const sb = getSupabase();
    if (!sb || !user || !userId || isOwnProfile) return;

    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            follower_count: wasFollowing ? prev.follower_count - 1 : prev.follower_count + 1,
          }
        : prev,
    );

    try {
      if (wasFollowing) {
        const { error } = await sb.from("follows").delete().eq("follower_id", user.id).eq("followed_id", userId);
        if (error) throw error;
      } else {
        const { error } = await sb.from("follows").insert({ follower_id: user.id, followed_id: userId });
        if (error) throw error;
      }
    } catch {
      setIsFollowing(wasFollowing);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              follower_count: wasFollowing ? prev.follower_count + 1 : prev.follower_count - 1,
            }
          : prev,
      );
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

  if (!profile) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "" }} />
        <Text style={styles.errorText}>{t("common.error")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: profile.display_name }} />

      {/* Header */}
      <View style={styles.header}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{getInitial(profile.display_name)}</Text>
          </View>
        )}
        <Text style={styles.displayName}>{profile.display_name}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.post_count}</Text>
            <Text style={styles.statLabel}>{t("profile.myPosts")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.follower_count}</Text>
            <Text style={styles.statLabel}>{isZh ? "粉絲" : "Followers"}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>{isZh ? "關注" : "Following"}</Text>
          </View>
        </View>

        {/* Actions */}
        {user && !isOwnProfile && (
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollow}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? (isZh ? "已關注" : "Following") : (isZh ? "關注" : "Follow")}
              </Text>
            </Pressable>
            <Pressable
              style={styles.blockBtn}
              onPress={() =>
                isBlocked(userId!) ? unblockUser(userId!) : blockUser(userId!)
              }
            >
              <Text style={styles.blockBtnText}>
                {isBlocked(userId!)
                  ? (isZh ? "取消拉黑" : "Unblock")
                  : (isZh ? "拉黑" : "Block")}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* User's posts */}
      <View style={styles.postsSection}>
        <Text style={styles.postsTitle}>
          {t("profile.myPosts")} ({profile.post_count})
        </Text>
        {posts.length === 0 ? (
          <Text style={styles.emptyText}>{t("common.noResults")}</Text>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPress={() => {
                captureEvent(COMMUNITY_EVENTS.POST_CARD_CLICKED, { post_id: post.id });
                router.push(`/post/${post.id}`);
              }}
            />
          ))
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
  header: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  avatarFallback: {
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B6560",
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: "#E5E5E5",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  followBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  followingBtn: {
    backgroundColor: "#F3F0EB",
  },
  followBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  followingBtnText: {
    color: "#6B6560",
  },
  blockBtn: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  blockBtnText: {
    fontSize: 15,
    color: "#6B6560",
  },
  postsSection: {
    marginTop: 8,
    paddingTop: 12,
  },
  postsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 24,
  },
});
