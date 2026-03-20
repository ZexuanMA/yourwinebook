import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { COMMUNITY_EVENTS } from "@ywb/domain";
import { captureEvent } from "../lib/posthog";

export type ReportTargetType = "post" | "comment" | "user";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

const REASONS = [
  { key: "spam", zh: "垃圾內容", en: "Spam" },
  { key: "harassment", zh: "騷擾或霸凌", en: "Harassment or bullying" },
  { key: "inappropriate", zh: "不當內容", en: "Inappropriate content" },
  { key: "misinformation", zh: "虛假信息", en: "Misinformation" },
  { key: "other", zh: "其他", en: "Other" },
];

export default function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
}: ReportModalProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith("zh");

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !user) return;

    const sb = getSupabase();
    if (!sb) return;

    setSubmitting(true);
    try {
      const { error } = await sb.from("reports").insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: selectedReason,
        details: details.trim() || null,
      });

      if (error) throw error;

      captureEvent(COMMUNITY_EVENTS.REPORT_SUBMITTED, {
        target_type: targetType,
        target_id: targetId,
        reason: selectedReason,
      });

      Alert.alert(
        isZh ? "已提交" : "Report Submitted",
        isZh ? "感謝你的舉報，我們會盡快處理。" : "Thank you for your report. We'll review it shortly.",
      );

      // Reset and close
      setSelectedReason(null);
      setDetails("");
      onClose();
    } catch {
      Alert.alert(t("common.error"), isZh ? "舉報失敗，請稍後重試。" : "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const targetLabel = isZh
    ? { post: "帖子", comment: "評論", user: "用戶" }[targetType]
    : { post: "post", comment: "comment", user: "user" }[targetType];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isZh ? `舉報${targetLabel}` : `Report ${targetLabel}`}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Reason list */}
          <Text style={styles.sectionLabel}>
            {isZh ? "原因" : "Reason"}
          </Text>
          {REASONS.map((reason) => (
            <Pressable
              key={reason.key}
              style={[
                styles.reasonRow,
                selectedReason === reason.key && styles.reasonSelected,
              ]}
              onPress={() => setSelectedReason(reason.key)}
            >
              <View style={styles.radio}>
                {selectedReason === reason.key && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.reasonText}>
                {isZh ? reason.zh : reason.en}
              </Text>
            </Pressable>
          ))}

          {/* Details */}
          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
            {isZh ? "補充說明（選填）" : "Additional details (optional)"}
          </Text>
          <TextInput
            style={styles.detailsInput}
            placeholder={isZh ? "描述你遇到的問題…" : "Describe the issue…"}
            placeholderTextColor="#9CA3AF"
            value={details}
            onChangeText={setDetails}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, (!selectedReason || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isZh ? "提交舉報" : "Submit Report"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C2C2C",
  },
  closeText: {
    fontSize: 18,
    color: "#6B6560",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B6560",
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  reasonSelected: {
    backgroundColor: "#F3F0EB",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#5B2E35",
  },
  reasonText: {
    fontSize: 15,
    color: "#2C2C2C",
  },
  detailsInput: {
    fontSize: 14,
    color: "#2C2C2C",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
  },
  submitBtn: {
    backgroundColor: "#E11D48",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnDisabled: {
    backgroundColor: "#E5E5E5",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
