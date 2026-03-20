import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  FlatList,
} from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { useBlockList } from "../hooks/useBlockList";

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : "?";
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const isZh = i18n.language.startsWith("zh");
  const { blockedUsers, unblockUser, refresh: refreshBlockList, loading: blockLoading } = useBlockList();

  const [showBlockList, setShowBlockList] = useState(false);

  const handleLanguageToggle = () => {
    const newLang = isZh ? "en" : "zh-HK";
    i18n.changeLanguage(newLang);
  };

  const handleSignOut = async () => {
    Alert.alert(
      t("auth.signOut"),
      isZh ? "確定要登出嗎？" : "Are you sure you want to sign out?",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("auth.signOut"),
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: t("profile.settings") }} />

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isZh ? "語言" : "Language"}</Text>
        <Pressable style={styles.row} onPress={handleLanguageToggle}>
          <Text style={styles.rowLabel}>{isZh ? "語言" : "Language"}</Text>
          <Text style={styles.rowValue}>{isZh ? "繁體中文" : "English"}</Text>
        </Pressable>
      </View>

      {/* Account */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isZh ? "帳號" : "Account"}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{isZh ? "電郵" : "Email"}</Text>
            <Text style={styles.rowValue}>{user.email}</Text>
          </View>
        </View>
      )}

      {/* Block list */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isZh ? "隱私" : "Privacy"}</Text>
          <Pressable
            style={styles.row}
            onPress={() => {
              setShowBlockList(!showBlockList);
              if (!showBlockList) refreshBlockList();
            }}
          >
            <Text style={styles.rowLabel}>{isZh ? "黑名單" : "Blocked Users"}</Text>
            <Text style={styles.rowValue}>
              {blockedUsers.length} {showBlockList ? "▲" : "▼"}
            </Text>
          </Pressable>
          {showBlockList && (
            <View style={styles.blockList}>
              {blockedUsers.length === 0 ? (
                <Text style={styles.emptyText}>
                  {isZh ? "沒有拉黑的用戶" : "No blocked users"}
                </Text>
              ) : (
                blockedUsers.map((bu) => (
                  <View key={bu.blocked_id} style={styles.blockRow}>
                    {bu.avatar_url ? (
                      <Image source={{ uri: bu.avatar_url }} style={styles.blockAvatar} />
                    ) : (
                      <View style={[styles.blockAvatar, styles.blockAvatarFallback]}>
                        <Text style={styles.blockAvatarText}>{getInitial(bu.display_name)}</Text>
                      </View>
                    )}
                    <Text style={styles.blockName}>{bu.display_name}</Text>
                    <Pressable
                      style={styles.unblockBtn}
                      onPress={() => unblockUser(bu.blocked_id)}
                    >
                      <Text style={styles.unblockBtnText}>
                        {isZh ? "取消拉黑" : "Unblock"}
                      </Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{isZh ? "關於" : "About"}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{isZh ? "版本" : "Version"}</Text>
          <Text style={styles.rowValue}>1.0.0 (MVP)</Text>
        </View>
      </View>

      {/* Sign out */}
      {user && (
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t("auth.signOut")}</Text>
        </Pressable>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B6560",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F0EB",
  },
  rowLabel: {
    fontSize: 15,
    color: "#2C2C2C",
  },
  rowValue: {
    fontSize: 15,
    color: "#6B6560",
  },
  blockList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  blockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  blockAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  blockAvatarFallback: {
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  blockAvatarText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  blockName: {
    flex: 1,
    fontSize: 14,
    color: "#2C2C2C",
  },
  unblockBtn: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unblockBtnText: {
    fontSize: 12,
    color: "#6B6560",
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 12,
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
