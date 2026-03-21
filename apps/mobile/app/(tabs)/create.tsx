import { useCallback, useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";
import {
  pickImages,
  uploadImages,
  retryFailedUploads,
  type PickedImage,
  type UploadResult,
  type UploadProgress,
  type UploadSession,
} from "../../lib/media";
import { COMMUNITY_EVENTS } from "@ywb/domain";
import { captureEvent } from "../../lib/posthog";
import UploadProgressBar, {
  type UploadItem,
  type UploadItemStatus,
} from "../../components/UploadProgressBar";
import { loadDraft, clearDraft, useAutoSaveDraft } from "../../hooks/useDraft";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

const MAX_IMAGES = 9;
const MAX_CONTENT = 2000;
const MAX_TITLE = 100;

export default function CreatePostScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastUploadSession, setLastUploadSession] = useState<UploadSession | null>(null);

  const { isConnected, justReconnected } = useNetworkStatus();

  // Restore draft on mount
  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft) {
        setTitle(draft.title);
        setContent(draft.content);
        setRating(draft.rating);
        if (draft.imageUris.length > 0) {
          setImages(draft.imageUris.map((uri) => ({ uri, width: 0, height: 0 })));
        }
        setDraftRestored(true);
      }
    });
  }, []);

  // Auto-save draft as user types
  useAutoSaveDraft(
    title,
    content,
    rating,
    images.map((img) => img.uri),
  );

  // Not logged in
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerEmoji}>✍️</Text>
        <Text style={styles.centerText}>{t("auth.loginPrompt")}</Text>
      </View>
    );
  }

  const handlePickImages = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const picked = await pickImages({ maxCount: remaining });
    if (picked.length > 0) {
      setImages((prev) => [...prev, ...picked]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRating = (star: number) => {
    setRating((prev) => (prev === star ? null : star));
  };

  const updateItemStatus = (index: number, status: UploadItemStatus, error?: string) => {
    setUploadItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, status, error } : item)),
    );
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert(t("common.error"), "Content is required");
      return;
    }

    const sb = getSupabase();
    if (!sb) return;

    setUploading(true);
    captureEvent(COMMUNITY_EVENTS.POST_CREATE_STARTED);

    // Initialize per-image tracking
    if (images.length > 0) {
      setUploadItems(images.map((img) => ({ uri: img.uri, status: "pending" as UploadItemStatus })));
    }

    try {
      // Step 1: Upload images (if any)
      let uploadResults: UploadResult[] = [];
      if (images.length > 0) {
        setUploadStatus(`0/${images.length}`);
        const uploadOut = await uploadImages(images, "posts", (p: UploadProgress) => {
          if (p.status === "compressing") {
            setUploadStatus(`Compressing ${p.index + 1}/${p.total}`);
            updateItemStatus(p.index, "compressing");
          } else if (p.status === "uploading") {
            setUploadStatus(`Uploading ${p.index + 1}/${p.total}`);
            updateItemStatus(p.index, "uploading");
          } else if (p.status === "done") {
            updateItemStatus(p.index, "done");
          } else if (p.status === "error") {
            updateItemStatus(p.index, "error", p.error);
          }
        });
        uploadResults = uploadOut.results;

        // If some uploads failed, save session for retry
        if (uploadOut.session.failedIndices.length > 0) {
          setLastUploadSession(uploadOut.session);
          const failCount = uploadOut.session.failedIndices.length;
          Alert.alert(
            t("common.error"),
            `${failCount} image(s) failed to upload. Tap retry to try again.`
          );
          setUploading(false);
          setUploadStatus("");
          return;
        }
      }

      // Step 2: Finalize post via Edge Function
      setUploadStatus("Finalizing...");
      captureEvent(COMMUNITY_EVENTS.POST_CREATE_SUBMITTED);

      const { data, error } = await sb.functions.invoke("finalize-post", {
        body: {
          content: trimmedContent,
          title: title.trim() || undefined,
          tags: [], // TODO: tag input UI
          rating: rating ?? undefined,
          media: uploadResults.map((r) => ({
            upload_id: r.intent.id,
            width: r.image.width,
            height: r.image.height,
          })),
          product_ids: [], // TODO: wine search UI
          is_official: false, // TODO: official toggle for merchant staff
        },
      });

      if (error) {
        throw new Error(error.message ?? "Failed to create post");
      }

      captureEvent(COMMUNITY_EVENTS.POST_CREATE_SUCCESS, {
        post_id: data?.post?.id,
        media_count: images.length,
      });

      // Reset form & clear draft
      setContent("");
      setTitle("");
      setRating(null);
      setImages([]);
      setUploadItems([]);
      setDraftRestored(false);
      setLastUploadSession(null);
      await clearDraft();

      // Navigate to feed
      router.replace("/(tabs)");
    } catch (err) {
      captureEvent(COMMUNITY_EVENTS.POST_CREATE_FAILED, {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      Alert.alert(t("common.error"), err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  const handleRetryUpload = async () => {
    if (!lastUploadSession || lastUploadSession.failedIndices.length === 0) return;

    const sb = getSupabase();
    if (!sb) return;

    setUploading(true);
    setUploadStatus("Retrying...");

    try {
      const retryOut = await retryFailedUploads(lastUploadSession, (p: UploadProgress) => {
        if (p.status === "uploading") {
          setUploadStatus(`Retrying ${p.index + 1}/${p.total}`);
          updateItemStatus(p.index, "uploading");
        } else if (p.status === "done") {
          updateItemStatus(p.index, "done");
        } else if (p.status === "error") {
          updateItemStatus(p.index, "error", p.error);
        }
      });

      if (retryOut.session.failedIndices.length > 0) {
        setLastUploadSession(retryOut.session);
        Alert.alert(
          t("common.error"),
          `${retryOut.session.failedIndices.length} image(s) still failed.`
        );
        setUploading(false);
        setUploadStatus("");
        return;
      }

      // All uploads now successful — finalize post
      setLastUploadSession(null);
      setUploadStatus("Finalizing...");
      captureEvent(COMMUNITY_EVENTS.POST_CREATE_SUBMITTED);

      const trimmedContent = content.trim();
      const { data, error } = await sb.functions.invoke("finalize-post", {
        body: {
          content: trimmedContent,
          title: title.trim() || undefined,
          tags: [],
          rating: rating ?? undefined,
          media: retryOut.results.map((r) => ({
            upload_id: r.intent.id,
            width: r.image.width,
            height: r.image.height,
          })),
          product_ids: [],
          is_official: false,
        },
      });

      if (error) throw new Error(error.message ?? "Failed to create post");

      captureEvent(COMMUNITY_EVENTS.POST_CREATE_SUCCESS, {
        post_id: data?.post?.id,
        media_count: images.length,
      });

      setContent("");
      setTitle("");
      setRating(null);
      setImages([]);
      setUploadItems([]);
      setDraftRestored(false);
      await clearDraft();
      router.replace("/(tabs)");
    } catch (err) {
      captureEvent(COMMUNITY_EVENTS.POST_CREATE_FAILED, {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      Alert.alert(t("common.error"), err instanceof Error ? err.message : "Retry failed");
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  const canSubmit = content.trim().length > 0 && !uploading;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Draft restored banner */}
        {draftRestored && (
          <View style={styles.draftBanner}>
            <Text style={styles.draftBannerText}>{t("create.draftRestored")}</Text>
            <Pressable
              onPress={() => {
                setTitle("");
                setContent("");
                setRating(null);
                setImages([]);
                setDraftRestored(false);
                clearDraft();
              }}
            >
              <Text style={styles.draftClearText}>{t("create.clearDraft")}</Text>
            </Pressable>
          </View>
        )}

        {/* Title (optional) */}
        <TextInput
          style={styles.titleInput}
          placeholder={t("create.title") + " (optional)"}
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
          maxLength={MAX_TITLE}
        />

        {/* Content */}
        <TextInput
          style={styles.contentInput}
          placeholder={t("create.placeholder")}
          placeholderTextColor="#9CA3AF"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={MAX_CONTENT}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>
          {content.length}/{MAX_CONTENT}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>Rating</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => handleRating(star)} hitSlop={4}>
                <Text style={styles.starText}>
                  {rating != null && star <= rating ? "★" : "☆"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Image thumbnails */}
        {images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
          >
            {images.map((img, i) => (
              <View key={i} style={styles.thumbnailWrap}>
                <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => handleRemoveImage(i)}
                  hitSlop={6}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <Pressable
            style={styles.actionItem}
            onPress={handlePickImages}
            disabled={images.length >= MAX_IMAGES || uploading}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>
              {t("create.addPhotos")} ({images.length}/{MAX_IMAGES})
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Offline banner */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>{t("common.offline")}</Text>
        </View>
      )}

      {/* Reconnected banner */}
      {justReconnected && lastUploadSession && lastUploadSession.failedIndices.length > 0 && (
        <View style={styles.reconnectBanner}>
          <Text style={styles.reconnectText}>{t("common.reconnected")}</Text>
          <Pressable onPress={handleRetryUpload}>
            <Text style={styles.reconnectRetryText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      )}

      {/* Upload progress */}
      {uploading && uploadItems.length > 0 && (
        <View style={styles.progressBar}>
          <UploadProgressBar items={uploadItems} onRetry={handleRetryUpload} />
        </View>
      )}

      {/* Retry bar (when uploads partially failed) */}
      {!uploading && lastUploadSession && lastUploadSession.failedIndices.length > 0 && (
        <View style={styles.retryBar}>
          <Text style={styles.retryText}>
            {lastUploadSession.failedIndices.length} image(s) failed
          </Text>
          <Pressable
            style={[styles.retryBtn, !isConnected && styles.submitBtnDisabled]}
            onPress={handleRetryUpload}
            disabled={!isConnected}
          >
            <Text style={styles.retryBtnText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      )}

      {/* Submit bar */}
      <View style={styles.submitBar}>
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color="#5B2E35" />
            <Text style={styles.uploadingText}>{uploadStatus}</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.submitBtn, (!canSubmit || !isConnected) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || !isConnected}
          >
            <Text style={[styles.submitBtnText, (!canSubmit || !isConnected) && styles.submitBtnTextDisabled]}>
              {t("create.post")}
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  centerText: {
    fontSize: 15,
    color: "#6B6560",
    textAlign: "center",
  },
  draftBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF9E7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  draftBannerText: {
    fontSize: 13,
    color: "#92400E",
  },
  draftClearText: {
    fontSize: 13,
    color: "#5B2E35",
    fontWeight: "600",
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2C2C",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 15,
    color: "#2C2C2C",
    lineHeight: 22,
    minHeight: 120,
    paddingVertical: 8,
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  ratingLabel: {
    fontSize: 14,
    color: "#6B6560",
  },
  stars: {
    flexDirection: "row",
    gap: 4,
  },
  starText: {
    fontSize: 24,
    color: "#B8956A",
  },
  imageScroll: {
    marginBottom: 12,
  },
  imageScrollContent: {
    gap: 8,
  },
  thumbnailWrap: {
    position: "relative",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2C2C2C",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionBar: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 13,
    color: "#6B6560",
  },
  progressBar: {
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  submitBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  submitBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#E5E5E5",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  submitBtnTextDisabled: {
    color: "#9CA3AF",
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  uploadingText: {
    fontSize: 14,
    color: "#5B2E35",
  },
  offlineBanner: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  offlineBannerText: {
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "500",
  },
  reconnectBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ECFDF5",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  reconnectText: {
    fontSize: 13,
    color: "#065F46",
  },
  reconnectRetryText: {
    fontSize: 13,
    color: "#5B2E35",
    fontWeight: "600",
  },
  retryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FEF9E7",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
  retryText: {
    fontSize: 13,
    color: "#92400E",
  },
  retryBtn: {
    backgroundColor: "#5B2E35",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
