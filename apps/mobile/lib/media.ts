import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  BUCKET_CONFIGS,
  COMPRESSION_TARGETS,
  validateFiles,
  type BucketName,
  type FileToValidate,
} from "@ywb/domain";
import { getSupabase } from "./supabase";

// ── Types ─────────────────────────────────────────────────────

export interface PickedImage {
  uri: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  fileName?: string;
}

export interface UploadIntent {
  id: string;
  path: string;
  bucket: string;
  upload_url: string;
  token: string;
  expires_at: string;
}

export interface UploadResult {
  intent: UploadIntent;
  image: PickedImage;
}

export interface UploadProgress {
  index: number;
  total: number;
  status: "compressing" | "uploading" | "done" | "error";
  error?: string;
}

// ── Image Picker ──────────────────────────────────────────────

export async function pickImages(options?: {
  maxCount?: number;
  allowsEditing?: boolean;
}): Promise<PickedImage[]> {
  const maxCount = options?.maxCount ?? 9;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: maxCount > 1,
    selectionLimit: maxCount,
    quality: 1,
    exif: false,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize ?? 0,
    fileName: asset.fileName ?? undefined,
  }));
}

export async function pickAvatar(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: false,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? "image/jpeg",
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize ?? 0,
    fileName: asset.fileName ?? undefined,
  };
}

// ── Image Compression ─────────────────────────────────────────

export async function compressImage(
  image: PickedImage,
  target: "post" | "avatar"
): Promise<PickedImage> {
  const maxDim =
    target === "avatar"
      ? COMPRESSION_TARGETS.avatarMaxDimension
      : COMPRESSION_TARGETS.postMaxDimension;
  const quality =
    target === "avatar"
      ? COMPRESSION_TARGETS.avatarJpegQuality
      : COMPRESSION_TARGETS.postJpegQuality;

  const longerSide = Math.max(image.width, image.height);

  // Skip compression if image is already small enough
  if (longerSide <= maxDim && image.fileSize <= BUCKET_CONFIGS[target === "avatar" ? "avatars" : "posts"].maxSizeBytes) {
    return image;
  }

  const actions: Array<{ resize: { width?: number; height?: number } }> = [];
  if (longerSide > maxDim) {
    if (image.width >= image.height) {
      actions.push({ resize: { width: maxDim } });
    } else {
      actions.push({ resize: { height: maxDim } });
    }
  }

  const result = await manipulateAsync(image.uri, actions, {
    compress: quality,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    mimeType: "image/jpeg",
    width: result.width,
    height: result.height,
    fileSize: 0, // manipulateAsync doesn't return fileSize, will be known after fetch
    fileName: image.fileName,
  };
}

// ── Upload SDK ────────────────────────────────────────────────

/**
 * Full upload flow:
 * 1. Compress images
 * 2. Request upload intents from Edge Function
 * 3. Upload files to signed URLs
 * 4. Return intents for use in finalize-post
 */
export async function uploadImages(
  images: PickedImage[],
  bucket: BucketName,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const session = (await supabase.auth.getSession()).data.session;
  if (!session) {
    throw new Error("Not authenticated");
  }

  const total = images.length;
  const target = bucket === "avatars" ? "avatar" : "post";

  // Step 1: Compress all images
  const compressed: PickedImage[] = [];
  for (let i = 0; i < images.length; i++) {
    onProgress?.({ index: i, total, status: "compressing" });
    const result = await compressImage(images[i], target);
    compressed.push(result);
  }

  // Step 2: Read file blobs to get actual sizes
  const blobs: Blob[] = [];
  for (const img of compressed) {
    const response = await fetch(img.uri);
    const blob = await response.blob();
    blobs.push(blob);
    img.fileSize = blob.size;
  }

  // Step 3: Validate before uploading
  const filesToValidate: FileToValidate[] = compressed.map((img) => ({
    mimeType: img.mimeType,
    sizeBytes: img.fileSize,
  }));
  const errors = validateFiles(bucket, filesToValidate);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }

  // Step 4: Request upload intents
  const { data, error } = await supabase.functions.invoke(
    "create-upload-intent",
    {
      body: {
        bucket,
        files: compressed.map((img) => ({
          mime_type: img.mimeType,
          size_bytes: img.fileSize,
        })),
      },
    }
  );

  if (error) {
    throw new Error(error.message ?? "Failed to create upload intents");
  }

  const intents: UploadIntent[] = data.intents;

  // Step 5: Upload files to signed URLs
  const results: UploadResult[] = [];
  for (let i = 0; i < intents.length; i++) {
    onProgress?.({ index: i, total, status: "uploading" });

    const intent = intents[i];
    const blob = blobs[i];

    try {
      const uploadResponse = await fetch(intent.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": compressed[i].mimeType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      results.push({ intent, image: compressed[i] });
      onProgress?.({ index: i, total, status: "done" });
    } catch (err) {
      onProgress?.({
        index: i,
        total,
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      });
      throw err;
    }
  }

  return results;
}
