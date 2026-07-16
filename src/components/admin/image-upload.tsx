"use client";

import { useState, useCallback } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type UploadedImage = {
  path: string;
  url: string;
  isCover: boolean;
};

export function ImageUpload({ initialImages = [] }: { initialImages?: UploadedImage[] }) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setError(null);
    const newImages: UploadedImage[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `vehicles/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(data.path);

      newImages.push({
        path: data.path,
        url: publicUrlData.publicUrl,
        isCover: false,
      });
    }

    setImages(prev => {
      const updated = [...prev, ...newImages];
      // Automatically set the first image as cover if none exists
      if (updated.length > 0 && !updated.some(img => img.isCover)) {
        updated[0].isCover = true;
      }
      return updated;
    });
    setUploading(false);
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = async (index: number) => {
    const imgToRemove = images[index];
    // If it's a new upload (we only have the path), we should ideally delete it from storage,
    // but for simplicity and safety against deleting existing assets in edit mode, 
    // we'll just remove it from the UI list. The unlinked storage file can be cleaned up via cron later.
    const newImages = images.filter((_, i) => i !== index);
    
    // Reassign cover if we removed the cover image
    if (imgToRemove.isCover && newImages.length > 0) {
      newImages[0].isCover = true;
    }
    
    setImages(newImages);
  };

  const setCover = (index: number) => {
    setImages(images.map((img, i) => ({
      ...img,
      isCover: i === index
    })));
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to pass to Server Action */}
      <input type="hidden" name="imageKeys" value={JSON.stringify(images)} />

      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 border-border bg-card transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="size-8 text-primary animate-spin mb-2" />
            ) : (
              <UploadCloud className="size-8 text-muted-foreground mb-2" />
            )}
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or WEBP (MAX. 10MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*" 
            onChange={handleFileChange} 
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {images.map((img, i) => (
            <div key={img.path} className="relative group aspect-square rounded-xl border border-border overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="Upload preview" className="object-cover w-full h-full" />
              
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
