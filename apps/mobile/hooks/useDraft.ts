import { useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DRAFT_KEY = "ywb:post_draft";

export interface PostDraft {
  title: string;
  content: string;
  rating: number | null;
  imageUris: string[]; // local URIs — may no longer exist if app restarts
  savedAt: number;
}

const EMPTY_DRAFT: PostDraft = { title: "", content: "", rating: null, imageUris: [], savedAt: 0 };

/** Load a previously saved draft (returns null if none). */
export async function loadDraft(): Promise<PostDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft: PostDraft = JSON.parse(raw);
    // Discard drafts older than 7 days
    if (Date.now() - draft.savedAt > 7 * 24 * 60 * 60 * 1000) {
      await AsyncStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

/** Persist draft to storage. */
export async function saveDraft(draft: Omit<PostDraft, "savedAt">): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Best-effort
  }
}

/** Clear saved draft. */
export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {
    // Best-effort
  }
}

/**
 * Auto-save draft when content changes (debounced).
 * Returns the save function for manual triggering.
 */
export function useAutoSaveDraft(
  title: string,
  content: string,
  rating: number | null,
  imageUris: string[],
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => {
    const hasContent = title.trim() || content.trim() || rating != null || imageUris.length > 0;
    if (hasContent) {
      saveDraft({ title, content, rating, imageUris });
    }
  }, [title, content, rating, imageUris]);

  useEffect(() => {
    // Debounce: save 1.5s after last change
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [save]);

  return save;
}
