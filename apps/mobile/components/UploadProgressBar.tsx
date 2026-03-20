import { View, Text, StyleSheet, Pressable, Image } from "react-native";

export type UploadItemStatus = "pending" | "compressing" | "uploading" | "done" | "error";

export interface UploadItem {
  uri: string;
  status: UploadItemStatus;
  error?: string;
}

interface UploadProgressBarProps {
  items: UploadItem[];
  onRetry?: (index: number) => void;
}

const STATUS_COLORS: Record<UploadItemStatus, string> = {
  pending: "#E5E5E5",
  compressing: "#B8956A",
  uploading: "#5B2E35",
  done: "#15803d",
  error: "#E11D48",
};

const STATUS_LABELS: Record<UploadItemStatus, string> = {
  pending: "…",
  compressing: "⚙️",
  uploading: "⬆️",
  done: "✓",
  error: "✕",
};

export default function UploadProgressBar({ items, onRetry }: UploadProgressBarProps) {
  const doneCount = items.filter((i) => i.status === "done").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const total = items.length;
  const progress = total > 0 ? doneCount / total : 0;

  return (
    <View style={styles.container}>
      {/* Overall progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {doneCount}/{total} {errorCount > 0 ? `(${errorCount} failed)` : ""}
      </Text>

      {/* Per-image indicators */}
      <View style={styles.itemsRow}>
        {items.map((item, i) => (
          <View key={i} style={styles.itemWrap}>
            <Image source={{ uri: item.uri }} style={styles.itemThumb} />
            <View
              style={[
                styles.statusOverlay,
                { backgroundColor: STATUS_COLORS[item.status] + "CC" },
              ]}
            >
              <Text style={styles.statusIcon}>{STATUS_LABELS[item.status]}</Text>
            </View>
            {item.status === "error" && onRetry && (
              <Pressable style={styles.retryBtn} onPress={() => onRetry(i)} hitSlop={6}>
                <Text style={styles.retryText}>↻</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#E5E5E5",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#5B2E35",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#6B6560",
    textAlign: "center",
  },
  itemsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  itemWrap: {
    position: "relative",
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: "hidden",
  },
  itemThumb: {
    width: 48,
    height: 48,
  },
  statusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  retryBtn: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
