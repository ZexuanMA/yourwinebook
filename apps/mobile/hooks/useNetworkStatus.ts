import { useState, useEffect, useRef, useCallback } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export interface NetworkStatus {
  isConnected: boolean;
  /** True when transitioning from offline to online */
  justReconnected: boolean;
}

/**
 * Hook that monitors network connectivity.
 * Returns current status and fires `onReconnect` when network comes back.
 */
export function useNetworkStatus(onReconnect?: () => void): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOffline = useRef(false);
  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      if (connected && wasOffline.current) {
        setJustReconnected(true);
        onReconnectRef.current?.();
        setTimeout(() => setJustReconnected(false), 3000);
      }

      wasOffline.current = !connected;
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, justReconnected };
}
