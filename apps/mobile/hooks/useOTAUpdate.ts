import { useEffect, useState, useCallback } from "react";
import * as Updates from "expo-updates";
import { Alert } from "react-native";

export interface OTAUpdateStatus {
  isChecking: boolean;
  isDownloading: boolean;
  isAvailable: boolean;
  error: string | null;
}

/**
 * Hook to check for and apply OTA updates via EAS Update.
 * Only active in non-development builds.
 */
export function useOTAUpdate() {
  const [status, setStatus] = useState<OTAUpdateStatus>({
    isChecking: false,
    isDownloading: false,
    isAvailable: false,
    error: null,
  });

  const checkForUpdate = useCallback(async () => {
    // Skip in development / Expo Go
    if (__DEV__ || !Updates.isEnabled) return;

    setStatus((s) => ({ ...s, isChecking: true, error: null }));

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setStatus((s) => ({
          ...s,
          isChecking: false,
          isAvailable: true,
          isDownloading: true,
        }));

        await Updates.fetchUpdateAsync();

        setStatus((s) => ({ ...s, isDownloading: false }));

        Alert.alert(
          "Update Available",
          "A new version has been downloaded. Restart to apply?",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Restart",
              onPress: () => Updates.reloadAsync(),
            },
          ]
        );
      } else {
        setStatus((s) => ({ ...s, isChecking: false }));
      }
    } catch (err) {
      setStatus((s) => ({
        ...s,
        isChecking: false,
        isDownloading: false,
        error: err instanceof Error ? err.message : "Update check failed",
      }));
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return { ...status, checkForUpdate };
}
