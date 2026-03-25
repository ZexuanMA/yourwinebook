import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : "?";
}

export default function EditProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const sb = getSupabase();
      if (!sb || !user) {
        setLoading(false);
        return;
      }

      const { data } = await sb
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    const sb = getSupabase();
    if (!sb || !user) return;

    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    // Upload to avatars bucket
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    const { error } = await sb.storage
      .from("avatars")
      .upload(path, blob, { upsert: true });

    if (error) {
      Alert.alert(
        t("common.error"),
        isZh ? "頭像上傳失敗" : "Failed to upload avatar"
      );
      return;
    }

    const { data: urlData } = sb.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

    // Update profile
    await sb
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setAvatarUrl(publicUrl);
  };

  const handleSaveProfile = async () => {
    const sb = getSupabase();
    if (!sb || !user) return;

    if (!displayName.trim()) {
      Alert.alert(
        t("common.error"),
        isZh ? "暱稱不能為空" : "Display name cannot be empty"
      );
      return;
    }

    setSaving(true);

    const { error } = await sb
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      Alert.alert(t("common.error"), error.message);
      return;
    }

    Alert.alert(
      "",
      isZh ? "已儲存" : "Saved",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert(
        t("common.error"),
        isZh ? "密碼至少需要 6 個字元" : "Password must be at least 6 characters"
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        t("common.error"),
        isZh ? "兩次輸入的密碼不一致" : "Passwords do not match"
      );
      return;
    }

    const sb = getSupabase();
    if (!sb) return;

    setPasswordSaving(true);

    const { error } = await sb.auth.updateUser({ password: newPassword });

    setPasswordSaving(false);

    if (error) {
      Alert.alert(t("common.error"), error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    Alert.alert("", isZh ? "密碼已更新" : "Password updated");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t("profile.editProfile") }} />
        <ActivityIndicator size="large" color="#5B2E35" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: t("profile.editProfile") }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <Pressable style={styles.avatarWrap} onPress={handlePickAvatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {getInitial(displayName)}
              </Text>
            </View>
          )}
          <Text style={styles.changeAvatarText}>
            {isZh ? "更換頭像" : "Change Avatar"}
          </Text>
        </Pressable>

        {/* Display name */}
        <Text style={styles.label}>{t("auth.displayName")}</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={50}
        />

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{t("common.save")}</Text>
          )}
        </Pressable>

        {/* Password change */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>
          {isZh ? "修改密碼" : "Change Password"}
        </Text>

        <Text style={styles.label}>
          {isZh ? "新密碼" : "New Password"}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={isZh ? "至少 6 個字元" : "At least 6 characters"}
          placeholderTextColor="#9CA3AF"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        <Text style={styles.label}>
          {isZh ? "確認密碼" : "Confirm Password"}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={isZh ? "再輸入一次" : "Enter again"}
          placeholderTextColor="#9CA3AF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Pressable
          style={[
            styles.saveBtn,
            styles.secondaryBtn,
            passwordSaving && styles.saveBtnDisabled,
          ]}
          onPress={handleChangePassword}
          disabled={passwordSaving || !newPassword}
        >
          {passwordSaving ? (
            <ActivityIndicator color="#5B2E35" />
          ) : (
            <Text style={[styles.saveBtnText, styles.secondaryBtnText]}>
              {isZh ? "更新密碼" : "Update Password"}
            </Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FAF8F5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F5" },
  container: { flex: 1 },
  content: { padding: 24 },
  avatarWrap: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "600",
  },
  changeAvatarText: {
    fontSize: 14,
    color: "#5B2E35",
    fontWeight: "500",
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C2C2C",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#2C2C2C",
  },
  saveBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#5B2E35",
  },
  secondaryBtnText: {
    color: "#5B2E35",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5E5",
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 4,
  },
});
