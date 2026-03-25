import { useState } from "react";
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
import { Stack, useRouter, Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../providers/AuthProvider";

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { signIn } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(isZh ? "請填寫電郵和密碼" : "Please enter email and password");
      return;
    }

    setError("");
    setLoading(true);

    const { error: authError } = await signIn(email.trim(), password);

    if (authError) {
      setError(
        isZh
          ? "登入失敗，請檢查電郵和密碼"
          : "Login failed. Please check your email and password."
      );
      setLoading(false);
      return;
    }

    // Success — go back
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: t("auth.signIn") }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Your Wine Book</Text>
          <Text style={styles.subtitle}>
            {isZh ? "登入你的帳號" : "Sign in to your account"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{t("auth.signIn")}</Text>
            )}
          </Pressable>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>
              {isZh ? "還沒有帳號？" : "Don't have an account? "}
            </Text>
            <Link href="/auth/register" asChild>
              <Pressable>
                <Text style={styles.linkAction}>{t("auth.signUp")}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
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
    marginBottom: 40,
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
