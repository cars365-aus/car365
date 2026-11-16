"use client";

import { useState } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type UploadedImage = {
  path: string;
  url: string;
  thumbPath?: string;
  thumbUrl?: string;
  isCover: boolean;
};

// ─── Dual-Variant Processing Targets ─────────────────────────────────────────
// Detail:
//   • Max 1600 px wide, 1200 px tall (strict aspect ratio preservation)
//   • WebP q=0.80 first pass; if >220 KB, re-encode at q=0.70 (target ~150-220 KB)
// Thumbnail:
//   • Max 480 px wide, 360 px tall (strict aspect ratio preservation)
//   • WebP q=0.75 (target ~35-50 KB)
// ─────────────────────────────────────────────────────────────────────────────
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB strict limit

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_DETAIL_W = 1600;
const MAX_DETAIL_H = 1200;
const DETAIL_QUALITY_HIGH = 0.80;
const DETAIL_QUALITY_FALLBACK = 0.70;
const DETAIL_TARGET_BYTES = 220 * 1024; // 220 KB target cap

const MAX_THUMB_W = 480;
const MAX_THUMB_H = 360;
const THUMB_QUALITY = 0.75;

function generatePhotoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const rand = Math.random().toString(36).substring(2, 10);
  return `${Date.now()}-${rand}`;
}

type ProcessedVariants = {
  detailBlob: Blob;
  thumbBlob: Blob;
  originalKb: number;
  compressedKb: number;
  thumbKb: number;
};

async function processImageVariants(file: File): Promise<ProcessedVariants> {
  const originalKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      if (!naturalW || !naturalH) {
        reject(new Error("Image has invalid dimensions"));
        return;
      }
      const ratio = naturalW / naturalH;

      // 1. Calculate detail dimensions preserving aspect ratio
      let detailW = naturalW;
      let detailH = naturalH;
      if (detailW > MAX_DETAIL_W) {
        detailW = MAX_DETAIL_W;
        detailH = Math.round(MAX_DETAIL_W / ratio);
      }
      if (detailH > MAX_DETAIL_H) {
        detailH = MAX_DETAIL_H;
        detailW = Math.round(MAX_DETAIL_H * ratio);
      }

      // 2. Calculate thumbnail dimensions preserving aspect ratio
      let thumbW = naturalW;
      let thumbH = naturalH;
      if (thumbW > MAX_THUMB_W) {
        thumbW = MAX_THUMB_W;
        thumbH = Math.round(MAX_THUMB_W / ratio);
      }
      if (thumbH > MAX_THUMB_H) {
        thumbH = MAX_THUMB_H;
        thumbW = Math.round(MAX_THUMB_H * ratio);
      }

      // Create detail canvas
      const detailCanvas = document.createElement("canvas");
      detailCanvas.width = detailW;
      detailCanvas.height = detailH;
      const detailCtx = detailCanvas.getContext("2d");
      if (!detailCtx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      detailCtx.fillStyle = "#ffffff";
      detailCtx.fillRect(0, 0, detailW, detailH);
      detailCtx.drawImage(img, 0, 0, detailW, detailH);

      // Create thumbnail canvas
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const thumbCtx = thumbCanvas.getContext("2d");
      if (!thumbCtx) {
        reject(new Error("Thumbnail canvas context unavailable"));
        return;
      }
      thumbCtx.fillStyle = "#ffffff";
      thumbCtx.fillRect(0, 0, thumbW, thumbH);
      thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);

      // Render thumbnail blob
      thumbCanvas.toBlob(
        (thumbBlob) => {
          if (!thumbBlob) {
            reject(new Error("Thumbnail generation failed"));
            return;
          }

          // Render detail blob (first pass)
          detailCanvas.toBlob(
            (detailBlob1) => {
              if (!detailBlob1) {
                reject(new Error("Detail image compression failed"));
                return;
              }

              if (detailBlob1.size <= DETAIL_TARGET_BYTES) {
                resolve({
                  detailBlob: detailBlob1,
                  thumbBlob,
                  originalKb,
                  compressedKb: Math.round(detailBlob1.size / 1024),
                  thumbKb: Math.round(thumbBlob.size / 1024),
                });
                return;
              }

              // Second pass at lower quality if over target goal
              detailCanvas.toBlob(
                (detailBlob2) => {
                  const finalDetail = detailBlob2 ?? detailBlob1;
                  resolve({
                    detailBlob: finalDetail,
                    thumbBlob,
                    originalKb,
                    compressedKb: Math.round(finalDetail.size / 1024),
                    thumbKb: Math.round(thumbBlob.size / 1024),
                  });
                },
                "image/webp",
                DETAIL_QUALITY_FALLBACK,
              );
            },
            "image/webp",
            DETAIL_QUALITY_HIGH,
          );
        },
        "image/webp",
        THUMB_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

type UploadStats = { originalKb: number; compressedKb: number };

export function ImageUpload({ initialImages = [] }: { initialImages?: UploadedImage[] }) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [prevInitialImages, setPrevInitialImages] = useState<UploadedImage[]>(initialImages);
  const [removedPersistedImages, setRemovedPersistedImages] = useState<UploadedImage[]>([]);

  // Track initial image paths so we distinguish between persisted and new session uploads
  const [persistedPathSet, setPersistedPathSet] = useState<Set<string>>(
    () => new Set(initialImages.map((img) => img.path)),
  );

  // Sync if initialImages changes from parent (e.g. Next.js router cache reusing components)
  if (initialImages !== prevInitialImages) {
    setPrevInitialImages(initialImages);
    setImages(initialImages);
    setPersistedPathSet(new Set(initialImages.map((img) => img.path)));
    setRemovedPersistedImages([]);
  }
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError(null);
    setStats(null);

    const newImages: UploadedImage[] = [];
    let totalOriginalKb = 0;
    let totalCompressedKb = 0;

    for (const file of files) {
      // 1. Strict 10 MB limit check
      if (file.size > MAX_FILE_BYTES) {
        setError(`"${file.name}" exceeds the maximum 10 MB file size limit and was skipped.`);
        continue;
      }

      // 2. Strict MIME type check
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        setError(`"${file.name}" has an unsupported format (${file.type || "unknown"}). Only JPEG, PNG, and WebP images are supported.`);
        continue;
      }

      let variants: ProcessedVariants;
      try {
        variants = await processImageVariants(file);
        totalOriginalKb += variants.originalKb;
        totalCompressedKb += variants.compressedKb;
      } catch (procErr) {
        const msg = procErr instanceof Error ? procErr.message : "Processing failed";
        setError(`Failed to process "${file.name}": ${msg}. Upload rejected.`);
        continue;
      }

      const photoId = generatePhotoId();
      const detailStorageKey = `vehicles/${photoId}_detail.webp`;
      const thumbStorageKey = `vehicles/thumbs/${photoId}_thumb.webp`;

      // 3. Upload detail variant (1-year immutable cache)
      const { data: detailData, error: detailUploadError } = await supabase.storage
        .from("media")
        .upload(detailStorageKey, variants.detailBlob, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });

      if (detailUploadError || !detailData) {
        setError(`Failed to upload ${file.name}: ${detailUploadError?.message ?? "Storage error"}`);
        continue;
      }

      // 4. Upload thumbnail variant (1-year immutable cache)
      let thumbPath: string | undefined = undefined;
      let thumbUrl: string | undefined = undefined;
      const { data: thumbData, error: thumbUploadError } = await supabase.storage
        .from("media")
        .upload(thumbStorageKey, variants.thumbBlob, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });

      if (thumbUploadError || !thumbData) {
        console.warn(`Failed to upload thumbnail for ${file.name}:`, thumbUploadError?.message);
      } else {
        thumbPath = thumbData.path;
        const { data: thumbUrlData } = supabase.storage.from("media").getPublicUrl(thumbData.path);
        thumbUrl = thumbUrlData.publicUrl;
      }

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(detailData.path);

      newImages.push({
        path: detailData.path,
        url: publicUrlData.publicUrl,
        thumbPath,
        thumbUrl: thumbUrl || publicUrlData.publicUrl,
        isCover: false,
      });
    }

    if (totalOriginalKb > 0) {
      setStats({ originalKb: totalOriginalKb, compressedKb: totalCompressedKb });
    }

    setImages((prev) => {
      const updated = [...prev, ...newImages];
      if (updated.length > 0 && !updated.some((img) => img.isCover)) {
        updated[0] = { ...updated[0], isCover: true };
      }
      return updated;
    });

    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    const imgToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    if (imgToRemove.isCover && newImages.length > 0) {
      newImages[0] = { ...newImages[0], isCover: true };
    }
    setImages(newImages);

    // Differentiate between persisted images and newly uploaded session images:
    if (persistedPathSet.has(imgToRemove.path)) {
      // 1. Existing persisted image:
      // Do NOT delete from storage now! Record it for deferred cleanup that only executes
      // after the database update successfully completes. If the user cancels the form
      // or the database save fails, the persisted image remains safely in storage.
      setRemovedPersistedImages((prev) => [...prev, imgToRemove]);
    } else if (imgToRemove?.path) {
      // 2. Newly uploaded uncommitted image from the current browser session:
      // Safe to delete immediately from storage since it was never referenced in the database.
      const keysToRemove = [imgToRemove.path];
      if (imgToRemove.thumbPath) keysToRemove.push(imgToRemove.thumbPath);
      supabase.storage.from("media").remove(keysToRemove).catch((err) => {
        console.warn("Storage cleanup notice for unsaved image:", err);
      });
    }
  };

  const setCover = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, isCover: i === index })));
  };

  const savingsPercent =
    stats && stats.originalKb > 0
      ? Math.round(((stats.originalKb - stats.compressedKb) / stats.originalKb) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Hidden inputs to pass to Server Action */}
      <input type="hidden" name="imageKeys" value={JSON.stringify(images)} />
      <input type="hidden" name="removedPersistedImages" value={JSON.stringify(removedPersistedImages)} />

      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 border-border bg-card transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <>
                <Loader2 className="size-8 text-primary animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Compressing &amp; uploading dual variants…</p>
              </>
            ) : (
              <>
                <UploadCloud className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP → auto-compressed with thumbnails (max 10 MB)
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Compression stats toast */}
      {stats && !uploading && (
        <div className="flex items-center gap-2.5 rounded-lg bg-success/8 border border-success/20 px-3.5 py-2.5 text-sm">
          <CheckCircle2 className="size-4 text-success shrink-0" />
          <span className="text-success font-medium">
            Compressed {stats.originalKb} KB → {stats.compressedKb} KB
            <span className="ml-1.5 font-bold">({savingsPercent}% smaller + thumbnail variant generated)</span>
          </span>
          <span className="ml-auto text-xs text-muted-foreground">WebP • 1-yr cache</span>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {images.map((img, i) => (
            <div
              key={img.path}
              className="relative group aspect-square rounded-xl border border-border overflow-hidden bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbUrl || img.url} alt="Upload preview" className="object-cover w-full h-full" />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="self-end p-1.5 bg-danger/80 hover:bg-danger text-white rounded-full transition-colors"
                  title="Remove image"
                >
                  <X className="size-4" />
                </button>

                {!img.isCover && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    className="w-full py-1.5 text-xs font-semibold bg-black/60 hover:bg-black text-white rounded transition-colors"
                  >
                    Set as Cover
                  </button>
                )}
              </div>

              {img.isCover && (
                <div className="absolute top-2 left-2 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                  <ImageIcon className="size-3" /> COVER
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
