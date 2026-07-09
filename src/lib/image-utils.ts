/**
 * image-utils.ts
 *
 * Single source of truth for resolving a vehicle image URL from Supabase Storage.
 *
 * The system uses TWO storage buckets:
 *   "vehicle-images"         — public  — images uploaded by APPROVED orgs   (approved=true)
 *   "pending-vehicle-images" — private — images uploaded by PENDING  orgs   (approved=false)
 *
 * getPublicUrl() on the PRIVATE bucket returns a URL that always 404s for public users.
 * This helper always routes to the correct bucket based on the `approved` flag.
 *
 * Priority order when resolving a fallback:
 *   1. Category-specific Unsplash stock photo (relevant visuals, never broken)
 *   2. Generic car placeholder
 */

/** Minimal image record returned from vehicle_images join */
export type VehicleImageRecord = {
  storage_path: string;
  approved: boolean;
  sort_order: number;
};

/** Category → stock photo fallback */
const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  Sedan:         "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
  SUV:           "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
  Van:           "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80",
  Ute:           "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
  Luxury:        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
  "People mover":"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
  Truck:         "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80",
  Electric:      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80",
  Hatchback:     "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=800&q=80",
};

const GENERIC_PLACEHOLDER =
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80";

/** Return an appropriate fallback for a category (never a broken URL). */
export function getCategoryFallback(category?: string | null): string {
  return (category && CATEGORY_PLACEHOLDERS[category]) ?? GENERIC_PLACEHOLDER;
}

/**
 * Build a Supabase Storage public URL for a vehicle_images row.
 *
 * @param supabaseUrl  process.env.NEXT_PUBLIC_SUPABASE_URL
 * @param img          A row from vehicle_images (needs storage_path + approved)
 */
export function buildStorageUrl(supabaseUrl: string, img: VehicleImageRecord): string {
  const bucket = img.approved ? "vehicle-images" : "pending-vehicle-images";
  // Construct direct public URL — avoids instantiating a Supabase client just for this
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${img.storage_path}`;
}

/**
 * Resolve the best displayable image URL for a vehicle given a list of
 * vehicle_images rows (already fetched from Supabase).
 *
 * Preference order:
 *   1. First approved image (lowest sort_order)
 *   2. First any image (lowest sort_order)  — so pending-org images still show
 *   3. Category stock photo fallback
 *
 * @param supabaseUrl   process.env.NEXT_PUBLIC_SUPABASE_URL
 * @param images        Rows from vehicle_images join
 * @param category      Vehicle category for fallback selection
 */
export function resolveVehicleImage(
  supabaseUrl: string,
  images: VehicleImageRecord[] | null | undefined,
  category?: string | null,
): string {
  if (!images || images.length === 0) {
    return getCategoryFallback(category);
  }

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  // Prefer approved (public bucket) first; fall back to any image
  const best = sorted.find((img) => img.approved) ?? sorted[0];
  return buildStorageUrl(supabaseUrl, best);
}

/**
 * Resolve ALL images for the detail-page gallery.
 * Returns an array of { url, alt_text } objects ready for <ImageGallery>.
 *
 * @param supabaseUrl   process.env.NEXT_PUBLIC_SUPABASE_URL
 * @param images        Rows from vehicle_images join (must include alt_text)
 * @param vehicleTitle  Used for default alt text
 */
export type GalleryImage = {
  id: string;
  url: string;
  alt_text: string;
};

export type FullImageRecord = VehicleImageRecord & {
  id: string;
  alt_text: string | null;
};

export function resolveGalleryImages(
  supabaseUrl: string,
  images: FullImageRecord[] | null | undefined,
  vehicleTitle: string,
): GalleryImage[] {
  if (!images || images.length === 0) return [];

  return [...images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      id: img.id,
      url: buildStorageUrl(supabaseUrl, img),
      alt_text: img.alt_text || `${vehicleTitle} rental car image`,
    }));
}

/**
 * Resolves a list of GalleryImage objects for a vehicle.
 * Combines Supabase database images with standard and custom image fields,
 * and falls back to a category-specific stock photo placeholder if all fields are empty.
 */
export function getVehicleImages(vehicle: any): GalleryImage[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const title = vehicle.title || "Rental Car";
  
  // 1. Collect from database vehicle_images relation
  const dbImages = (vehicle.vehicle_images as FullImageRecord[]) || [];
  const galleryImages = resolveGalleryImages(supabaseUrl, dbImages, title);
  
  // 2. Collect other potential custom/standard fields defensively
  const rawUrls: string[] = [];
  if (typeof vehicle.featuredImage === "string" && vehicle.featuredImage.trim()) {
    rawUrls.push(vehicle.featuredImage);
  }
  if (typeof vehicle.image === "string" && vehicle.image.trim()) {
    rawUrls.push(vehicle.image);
  }
  if (typeof vehicle.thumbnail === "string" && vehicle.thumbnail.trim()) {
    rawUrls.push(vehicle.thumbnail);
  }
  
  if (Array.isArray(vehicle.images)) {
    vehicle.images.forEach((img: any) => {
      if (typeof img === "string" && img.trim()) {
        rawUrls.push(img);
      } else if (img && typeof img.url === "string" && img.url.trim()) {
        rawUrls.push(img.url);
      }
    });
  }
  
  if (Array.isArray(vehicle.gallery)) {
    vehicle.gallery.forEach((img: any) => {
      if (typeof img === "string" && img.trim()) {
        rawUrls.push(img);
      } else if (img && typeof img.url === "string" && img.url.trim()) {
        rawUrls.push(img.url);
      }
    });
  }
  
  const customImages: GalleryImage[] = rawUrls.map((url, index) => ({
    id: `custom-img-${index}-${Date.now()}`,
    url,
    alt_text: `${title} rental car image`,
  }));
  
  const combined = [...galleryImages, ...customImages];
  
  // 3. Fallback to category stock photo if completely empty
  if (combined.length === 0) {
    const fallbackUrl = getCategoryFallback(vehicle.category);
    return [
      {
        id: "fallback-category-stock",
        url: fallbackUrl,
        alt_text: `${title} placeholder stock image`,
      },
    ];
  }
  
  return combined;
}
