import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter, Link, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../providers/AuthProvider";

const INVITE_CODE_KEY = "ywb_invite_code";

function getPasswordStrength(password: string): {
  level: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Weak", color: "#DC2626" };
  if (score <= 2) return { level: 2, label: "Fair", color: "#F59E0B" };
  if (score <= 3) return { level: 3, label: "Good", color: "#3B82F6" };
  return { level: 4, label: "Strong", color: "#22C55E" };
}

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { signUp } = useAuth();
  const params = useLocalSearchParams<{ inviteCode?: string }>();
  const isZh = i18n.language.startsWith("zh");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load invite code from deep link or AsyncStorage
  useEffect(() => {
    if (params.inviteCode) {
      setInviteCode(params.inviteCode);
      return;
    }
    AsyncStorage.getItem(INVITE_CODE_KEY).then((code) => {
      if (code) {
        setInviteCode(code);
        AsyncStorage.removeItem(INVITE_CODE_KEY);
      }
    });
  }, [params.inviteCode]);

  const passwordStrength = getPasswordStrength(password);

  const handleRegister = async () => {
    if (!displayName.trim()) {
      setError(isZh ? "請填寫暱稱" : "Please enter a display name");
      return;
    }
    if (!email.trim()) {
      setError(isZh ? "請填寫電郵地址" : "Please enter an email address");
      return;
    }
    if (password.length < 6) {
      setError(isZh ? "密碼至少需要 6 個字元" : "Password must be at least 6 characters");
      return;
    }
    if (!ageConfirmed) {
      setError(isZh ? "請確認你已年滿 18 歲" : "Please confirm you are 18 or older");
      return;
    }

    setError("");
    setLoading(true);

    const { error: authError } = await signUp(
      email.trim(),
      password,
      displayName.trim()
    );

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError(isZh ? "此電郵已被註冊" : "This email is already registered");
      } else {
        setError(
          isZh ? "註冊失敗，請稍後再試" : "Registration failed. Please try again."
        );
      }
      setLoading(false);
      return;
    }

    // Success — go to feed
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: t("auth.signUp") }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Your Wine Book</Text>
          <Text style={styles.subtitle}>
            {isZh ? "建立你的帳號" : "Create your account"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>{t("auth.displayName")}</Text>
          <TextInput
            style={styles.input}
            placeholder={isZh ? "你的暱稱" : "Your display name"}
            placeholderTextColor="#9CA3AF"
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
            textContentType="name"
          />

          <Text style={styles.label}>{t("auth.email")}</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <Text style={styles.label}>{t("auth.password")}</Text>
          <TextInput
            style={styles.input}
            placeholder={isZh ? "至少 6 個字元" : "At least 6 characters"}
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />

          {/* Password strength */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBar}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthSegment,
                      {
                        backgroundColor:
                          i <= passwordStrength.level
                            ? passwordStrength.color
                            : "#E5E5E5",
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[styles.strengthLabel, { color: passwordStrength.color }]}
              >
                {passwordStrength.label}
              </Text>
            </View>
          )}

          {/* Invite code */}
          <Text style={styles.label}>
            {isZh ? "邀請碼（選填）" : "Invite Code (optional)"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={isZh ? "如有邀請碼請輸入" : "Enter invite code if you have one"}
            placeholderTextColor="#9CA3AF"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
          />

          {/* Age confirmation */}
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgeConfirmed(!ageConfirmed)}
          >
            <View
              style={[
                styles.checkbox,
                ageConfirmed && styles.checkboxChecked,
              ]}
            >
              {ageConfirmed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              {isZh
                ? "我確認已年滿 18 歲，並同意使用條款和私隱政策"
                : "I confirm I am 18 or older and agree to the Terms & Privacy Policy"}
            </Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{t("auth.signUp")}</Text>
            )}
          </Pressable>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>
              {isZh ? "已有帳號？" : "Already have an account? "}
            </Text>
            <Link href="/auth/login" asChild>
              <Pressable>
                <Text style={styles.linkAction}>{t("auth.signIn")}</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#FAF8F5" },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#5B2E35",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B6560",
    marginTop: 8,
  },
  form: {
    gap: 4,
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
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  strengthBar: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
    width: 48,
    textAlign: "right",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#5B2E35",
    borderColor: "#5B2E35",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#6B6560",
    flex: 1,
    lineHeight: 18,
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: "#6B6560",
  },
  linkAction: {
    fontSize: 14,
    color: "#5B2E35",
    fontWeight: "600",
  },
});
