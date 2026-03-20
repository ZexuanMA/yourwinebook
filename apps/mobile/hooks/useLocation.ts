import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";

export type LocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "error";

interface LocationState {
  status: LocationStatus;
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    status: "idle",
    latitude: null,
    longitude: null,
    error: null,
  });

  const requestLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "requesting", error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setState((prev) => ({
          ...prev,
          status: "denied",
          error: "location_denied",
        }));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setState({
        status: "granted",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "unknown_error",
      }));
    }
  }, []);

  // Check permission on mount without prompting
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (!mounted) return;

        if (status === "granted") {
          // Already granted — get position immediately
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!mounted) return;
          setState({
            status: "granted",
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            error: null,
          });
        }
        // If not granted, stay idle — don't prompt automatically
      } catch {
        // Silently ignore check errors
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    ...state,
    requestLocation,
    hasCoords: state.latitude !== null && state.longitude !== null,
  };
}
