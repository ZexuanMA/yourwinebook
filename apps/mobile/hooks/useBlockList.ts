import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { COMMUNITY_EVENTS } from "@ywb/domain";
import { captureEvent } from "../lib/posthog";

interface BlockedUser {
  blocked_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export function useBlockList() {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlockList = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !user) return;

    setLoading(true);
    const { data } = await sb
      .from("blocks")
      .select("blocked_id, created_at, profiles!blocks_blocked_id_fkey(display_name, avatar_url)")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const users: BlockedUser[] = data.map((row: Record<string, unknown>) => {
        const profile = row.profiles as { display_name: string; avatar_url: string | null } | null;
        return {
          blocked_id: row.blocked_id as string,
          display_name: profile?.display_name ?? "",
          avatar_url: profile?.avatar_url ?? null,
          created_at: row.created_at as string,
        };
      });
      setBlockedUsers(users);
      setBlockedIds(new Set(users.map((u) => u.blocked_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBlockList();
  }, [fetchBlockList]);

  const blockUser = useCallback(
    async (targetId: string) => {
      const sb = getSupabase();
      if (!sb || !user || user.id === targetId) return;

      // Optimistic
      setBlockedIds((prev) => new Set([...prev, targetId]));

      const { error } = await sb
        .from("blocks")
        .insert({ blocker_id: user.id, blocked_id: targetId });

      if (error) {
        // Rollback
        setBlockedIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        return;
      }

      captureEvent(COMMUNITY_EVENTS.USER_BLOCKED, { target_id: targetId });
      fetchBlockList();
    },
    [user, fetchBlockList],
  );

  const unblockUser = useCallback(
    async (targetId: string) => {
      const sb = getSupabase();
      if (!sb || !user) return;

      // Optimistic
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });

      const { error } = await sb
        .from("blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetId);

      if (error) {
        // Rollback
        setBlockedIds((prev) => new Set([...prev, targetId]));
        return;
      }

      captureEvent(COMMUNITY_EVENTS.USER_UNBLOCKED, { target_id: targetId });
      fetchBlockList();
    },
    [user, fetchBlockList],
  );

  const isBlocked = useCallback(
    (targetId: string) => blockedIds.has(targetId),
    [blockedIds],
  );

  return { blockedIds, blockedUsers, loading, blockUser, unblockUser, isBlocked, refresh: fetchBlockList };
}
