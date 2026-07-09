import { optionalEnv } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
const BUCKET = "blog-images";

export interface BlogImageResult {
  url: string;
  alt: string;
  source: "imagen" | "unsplash";
}


async function fetchUnsplashImage(query: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const accessKey = optionalEnv("UNSPLASH_ACCESS_KEY");
  if (!accessKey) return null;

  try {
    const searchUrl = new URL("https://api.unsplash.com/search/photos");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("per_page", "15");
    searchUrl.searchParams.set("orientation", "landscape");

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!searchRes.ok) {
      console.warn(`[blog-image] Unsplash API error: ${searchRes.status} ${searchRes.statusText} - ${await searchRes.text()}`);
      return null;
    }

    const searchData = (await searchRes.json()) as {
      results?: { urls?: { regular?: string } }[];
    };
    
    if (!searchData.results || searchData.results.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * searchData.results.length);
    const imageUrl = searchData.results[randomIndex]?.urls?.regular;
    
    if (!imageUrl) return null;

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;

    const mimeType = imageRes.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    return { buffer, mimeType };
  } catch (err) {
    console.warn("[blog-image] Unsplash fallback failed:", err);
    return null;
  }
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("png")) return "png";
  return "jpg";
}

async function uploadToStorage(
  slug: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const ext = extensionForMime(mimeType);
  const path = `${slug}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[blog-image] Upload failed:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function resolveBlogFeaturedImage(input: {
  slug: string;
  imagePrompt: string;
  alt: string;
  searchQuery: string;
}): Promise<BlogImageResult | null> {
  const unsplash = await fetchUnsplashImage(input.searchQuery);
  if (!unsplash) return null;

  const url = await uploadToStorage(input.slug, unsplash.buffer, unsplash.mimeType);
  if (!url) return null;

  return { url, alt: input.alt, source: "unsplash" };
}
