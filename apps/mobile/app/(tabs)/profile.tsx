import { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

interface ProfileData {
  display_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  post_count: number;
  follower_count: number;
  following_count: number;
}

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : "?";
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await sb
      .from("profiles")
      .select("display_name, email, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    // Count user's posts
    const { count: postCount } = await sb
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("status", "visible");

    // Count followers/following
    const { count: followerCount } = await sb
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followed_id", user.id);

    const { count: followingCount } = await sb
      .from("follows")
      .select("followed_id", { count: "exact", head: true })
      .eq("follower_id", user.id);

    if (profileData) {
      setProfile({
        ...profileData,
        post_count: postCount ?? 0,
        follower_count: followerCount ?? 0,
        following_count: followingCount ?? 0,
      });
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Not logged in
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerEmoji}>👤</Text>
        <Text style={styles.centerTitle}>{t("auth.notLoggedIn")}</Text>
        <Text style={styles.centerSubtitle}>{t("auth.loginPrompt")}</Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push("/auth/login")}>
          <Text style={styles.loginBtnText}>{t("auth.signIn")}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B2E35" />
      </View>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {getInitial(profile?.display_name ?? "")}
            </Text>
          </View>
        )}
        <Text style={styles.displayName}>{profile?.display_name ?? ""}</Text>
        <Text style={styles.email}>{profile?.email ?? ""}</Text>

        <Pressable
          style={styles.editProfileBtn}
          onPress={() => router.push("/edit-profile")}
        >
          <Text style={styles.editProfileBtnText}>{t("profile.editProfile")}</Text>
        </Pressable>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.post_count ?? 0}</Text>
            <Text style={styles.statLabel}>{t("profile.myPosts")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.follower_count ?? 0}</Text>
            <Text style={styles.statLabel}>{isZh ? "粉絲" : "Followers"}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.following_count ?? 0}</Text>
            <Text style={styles.statLabel}>{isZh ? "關注" : "Following"}</Text>
          </View>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        <MenuItem
          label={t("profile.myPosts")}
          icon="📝"
          onPress={() => router.push("/my-posts")}
        />
        <MenuItem
          label={t("profile.bookmarks")}
          icon="🔖"
          onPress={() => router.push("/bookmarks")}
        />
        <MenuItem
          label={isZh ? "黑名單" : "Blocked Users"}
          icon="🚫"
          onPress={() => router.push("/settings")}
        />
        <MenuItem
          label={t("profile.settings")}
          icon="⚙️"
          onPress={() => router.push("/settings")}
        />
      </View>

      {/* Sign out */}
      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t("auth.signOut")}</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MenuItem({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={menuStyles.row} onPress={onPress}>
      <Text style={menuStyles.icon}>{icon}</Text>
      <Text style={menuStyles.label}>{label}</Text>
      <Text style={menuStyles.arrow}>›</Text>
    </Pressable>
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
  centerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  centerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  centerSubtitle: {
    fontSize: 14,
    color: "#6B6560",
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
  email: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  editProfileBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#5B2E35",
    borderRadius: 8,
  },
  editProfileBtnText: {
    fontSize: 13,
    color: "#5B2E35",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 0,
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
  menu: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  signOutBtn: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 16,
    color: "#E11D48",
    fontWeight: "500",
  },
});

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F0EB",
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: "#2C2C2C",
  },
  arrow: {
    fontSize: 18,
    color: "#9CA3AF",
  },
});
