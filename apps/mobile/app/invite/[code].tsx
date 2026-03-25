import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

const INVITE_CODE_KEY = "ywb_invite_code";

export default function InviteDeepLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "logged_in">("loading");

  useEffect(() => {
    if (!code) {
      setStatus("invalid");
      return;
    }

    // Already logged in
    if (user) {
      setStatus("logged_in");
      return;
    }

    // Validate invite code
    const validate = async () => {
      const sb = getSupabase();
      if (!sb) {
        // No Supabase — store code and go to register
        await AsyncStorage.setItem(INVITE_CODE_KEY, code);
        setStatus("valid");
        return;
      }

      const { data, error } = await sb
        .from("invite_codes")
        .select("code, max_uses, used_count, expires_at")
        .eq("code", code.toUpperCase())
        .single();

      if (error || !data) {
        setStatus("invalid");
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setStatus("invalid");
        return;
      }

      // Check usage limit
      if (data.max_uses && data.used_count >= data.max_uses) {
        setStatus("invalid");
        return;
      }

      // Valid — store and redirect
      await AsyncStorage.setItem(INVITE_CODE_KEY, code.toUpperCase());
      setStatus("valid");
    };

    validate();
  }, [code, user]);

  // Auto-redirect when valid
  useEffect(() => {
    if (status === "valid") {
      const timer = setTimeout(() => {
        router.replace({
          pathname: "/auth/register",
          params: { inviteCode: code },
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, code, router]);

  if (status === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5B2E35" />
        <Text style={styles.text}>
          {isZh ? "驗證邀請碼…" : "Verifying invite code…"}
        </Text>
      </View>
    );
  }

  if (status === "logged_in") {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.title}>
          {isZh ? "你已經登入了" : "You're already signed in"}
        </Text>
        <Text style={styles.subtitle}>
          {isZh
            ? "邀請碼適用於新用戶註冊"
            : "Invite codes are for new user registration"}
        </Text>
        <Pressable style={styles.btn} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.btnText}>
            {isZh ? "前往首頁" : "Go to Home"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (status === "invalid") {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>😕</Text>
        <Text style={styles.title}>
          {isZh ? "邀請碼無效或已過期" : "Invalid or expired invite code"}
        </Text>
        <Text style={styles.subtitle}>
          {isZh
            ? "請確認你的邀請碼是否正確，或聯繫邀請你的人"
            : "Please check your invite code or contact the person who invited you"}
        </Text>
        <Pressable style={styles.btn} onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.btnText}>
            {isZh ? "前往首頁" : "Go to Home"}
          </Text>
        </Pressable>
      </View>
    );
  }

  // Valid — showing redirect message
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>
        {isZh ? "邀請碼有效！" : "Invite code accepted!"}
      </Text>
      <Text style={styles.subtitle}>
        {isZh ? "正在前往註冊頁面…" : "Redirecting to registration…"}
      </Text>
      <ActivityIndicator size="small" color="#5B2E35" style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF8F5",
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2C2C",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B6560",
    textAlign: "center",
    lineHeight: 20,
  },
  text: {
    fontSize: 14,
    color: "#6B6560",
    marginTop: 12,
  },
  btn: {
    marginTop: 24,
    backgroundColor: "#5B2E35",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
