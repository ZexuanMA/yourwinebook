// ── Bucket Constraints ────────────────────────────────────────

export type BucketName = "posts" | "avatars" | "merchants";

export interface BucketConfig {
  maxSizeBytes: number;
  maxFiles: number;
  allowedMimeTypes: readonly string[];
}

export const BUCKET_CONFIGS: Record<BucketName, BucketConfig> = {
  posts: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    maxFiles: 9,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ],
  },
  avatars: {
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    maxFiles: 1,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  merchants: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxFiles: 5,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ],
  },
} as const;

// ── Validation ────────────────────────────────────────────────

export interface MediaValidationError {
  field: string;
  message: string;
}

export interface FileToValidate {
  name?: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Validate a list of files against a bucket's constraints.
 * Returns an empty array if all files are valid.
 */
export function validateFiles(
  bucket: BucketName,
  files: FileToValidate[]
): MediaValidationError[] {
  const config = BUCKET_CONFIGS[bucket];
  const errors: MediaValidationError[] = [];

  if (files.length === 0) {
    errors.push({ field: "files", message: "At least one file is required" });
    return errors;
  }

  if (files.length > config.maxFiles) {
    errors.push({
      field: "files",
      message: `Maximum ${config.maxFiles} file(s) allowed for ${bucket}`,
    });
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const prefix = `files[${i}]`;

    if (!config.allowedMimeTypes.includes(file.mimeType)) {
      errors.push({
        field: `${prefix}.mimeType`,
        message: `"${file.mimeType}" is not allowed. Accepted: ${config.allowedMimeTypes.join(", ")}`,
      });
    }

    if (file.sizeBytes <= 0) {
      errors.push({
        field: `${prefix}.sizeBytes`,
        message: "File size must be greater than 0",
      });
    } else if (file.sizeBytes > config.maxSizeBytes) {
      errors.push({
        field: `${prefix}.sizeBytes`,
        message: `File is ${formatBytes(file.sizeBytes)} but maximum is ${formatBytes(config.maxSizeBytes)}`,
      });
    }
  }

  return errors;
}

// ── Compression Targets ───────────────────────────────────────

export const COMPRESSION_TARGETS = {
  /** Max dimension for post images (longer side) */
  postMaxDimension: 2048,
  /** JPEG quality for post images (0-1) */
  postJpegQuality: 0.8,
  /** Max dimension for avatars */
  avatarMaxDimension: 512,
  /** JPEG quality for avatars */
  avatarJpegQuality: 0.85,
} as const;

// ── Post Content Limits ───────────────────────────────────────

export const POST_LIMITS = {
  maxContentLength: 2000,
  maxMediaCount: 9,
  maxProductReferences: 10,
} as const;

// ── Helpers ───────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
