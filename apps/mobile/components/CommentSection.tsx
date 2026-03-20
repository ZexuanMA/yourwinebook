import { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { COMMUNITY_EVENTS } from "@ywb/domain";
import { captureEvent } from "../lib/posthog";

function generateKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  isPending?: boolean;
}

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  onCommentCountChange?: (delta: number) => void;
  blockedIds?: Set<string>;
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

function getInitial(name: string): string {
  return name ? name.charAt(0).toUpperCase() : "?";
}

export default function CommentSection({
  postId,
  commentCount,
  onCommentCountChange,
  blockedIds,
}: CommentSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const fetchComments = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    const { data, error } = await sb
      .from("comments")
      .select("id, content, created_at, author_id, profiles!comments_author_id_fkey(display_name, avatar_url)")
      .eq("post_id", postId)
      .eq("status", "visible")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(
        data.map((c: Record<string, unknown>) => {
          const profile = c.profiles as { display_name: string; avatar_url: string | null } | null;
          return {
            id: c.id as string,
            content: c.content as string,
            created_at: c.created_at as string,
            author_id: c.author_id as string,
            author_name: profile?.display_name ?? "",
            author_avatar: profile?.avatar_url ?? null,
          };
        }),
      );
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || !user || submitting) return;

    const sb = getSupabase();
    if (!sb) return;

    const idempotencyKey = generateKey();
    const optimisticComment: Comment = {
      id: idempotencyKey,
      content: trimmed,
      created_at: new Date().toISOString(),
      author_id: user.id,
      author_name: user.user_metadata?.display_name ?? user.email ?? "",
      author_avatar: user.user_metadata?.avatar_url ?? null,
      isPending: true,
    };

    // Optimistic insert
    setComments((prev) => [...prev, optimisticComment]);
    setInput("");
    setSubmitting(true);
    captureEvent(COMMUNITY_EVENTS.COMMENT_SUBMITTED, { post_id: postId });

    try {
      const { data, error } = await sb.functions.invoke("create-comment", {
        body: {
          post_id: postId,
          content: trimmed,
          idempotency_key: idempotencyKey,
        },
      });

      if (error) throw new Error(error.message ?? "Failed to post comment");

      const serverComment = data.comment;

      // Replace optimistic with server data
      setComments((prev) =>
        prev.map((c) =>
          c.id === idempotencyKey
            ? {
                id: serverComment.id,
                content: serverComment.content,
                created_at: serverComment.created_at,
                author_id: serverComment.author_id,
                author_name: serverComment.author_name ?? optimisticComment.author_name,
                author_avatar: serverComment.author_avatar ?? optimisticComment.author_avatar,
              }
            : c,
        ),
      );

      onCommentCountChange?.(1);
      captureEvent(COMMUNITY_EVENTS.COMMENT_SUCCESS, { post_id: postId });
    } catch {
      // Rollback optimistic insert
      setComments((prev) => prev.filter((c) => c.id !== idempotencyKey));
      captureEvent(COMMUNITY_EVENTS.COMMENT_FAILED, { post_id: postId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t("feed.comment")} ({commentCount})
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color="#5B2E35" style={{ marginVertical: 16 }} />
      ) : comments.filter((c) => !blockedIds?.has(c.author_id)).length === 0 ? (
        <Text style={styles.emptyText}>
          {t("common.noResults")}
        </Text>
      ) : (
        <View style={styles.commentList}>
          {comments.filter((c) => !blockedIds?.has(c.author_id)).map((comment) => (
            <View
              key={comment.id}
              style={[styles.commentRow, comment.isPending && styles.pendingComment]}
            >
              {comment.author_avatar ? (
                <Image source={{ uri: comment.author_avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{getInitial(comment.author_name)}</Text>
                </View>
              )}
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                  <Text style={styles.commentTime}>{relativeTime(comment.created_at)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Input bar */}
      {user ? (
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t("create.placeholder")}
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            maxLength={1000}
            multiline
            editable={!submitting}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={handleSubmit}
            disabled={!input.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Text style={styles.loginPrompt}>{t("auth.loginPrompt")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 16,
  },
  commentList: {
    gap: 12,
    marginBottom: 16,
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
  },
  pendingComment: {
    opacity: 0.6,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarFallback: {
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  commentTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  commentContent: {
    fontSize: 14,
    color: "#4B4B4B",
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
    paddingTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#2C2C2C",
    maxHeight: 80,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F0EB",
    borderRadius: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#5B2E35",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#E5E5E5",
  },
  sendBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  loginPrompt: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
  },
});
