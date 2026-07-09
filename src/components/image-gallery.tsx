"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { PaginationDots } from "./pagination-dots";

interface GalleryImage {
  id: string;
  url: string;
  alt_text: string;
}

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Swipe gesture: left = next image, right = previous image
  useSwipeGesture(galleryRef, {
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
  });

  // Pinch-to-zoom on touch devices
  const { scale, origin, isPinching } = usePinchZoom(galleryRef);

  // Apply the zoom transform whenever the image is scaled beyond its natural size
  const isZoomed = scale > 1;

  if (!images || images.length === 0) {
    return (
      <div className="flex h-[420px] w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
        <ImageIcon className="mb-2 h-12 w-12" />
        <p>No images available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        ref={galleryRef}
        className="gallery-main-frame group relative h-[420px] w-full overflow-hidden bg-slate-100 touch-pan-y select-none"
      >
        <div
          style={{
            transform: isZoomed
              ? `scale(${scale})`
              : undefined,
            transformOrigin: isZoomed
              ? `${origin.x}px ${origin.y}px`
              : undefined,
            // will-change is a GPU performance hint placed on the element that is
            // actually transformed. It is only present during the active pinch
            // gesture and removed (set to "auto") once the gesture completes, so the
            // browser does not keep a compositor layer alive longer than needed.
            willChange: isPinching ? "transform" : "auto",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <ImageWithFallback
            src={images[currentIndex].url}
            alt={images[currentIndex].alt_text || "Vehicle Image"}
            fill
            loading={currentIndex === 0 ? "eager" : "lazy"}
            fetchPriority={currentIndex === 0 ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 820px"
            className="object-cover transition-opacity duration-300"
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="hidden md:flex absolute left-4 top-1/2 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100 touch-target"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="hidden md:flex absolute right-4 top-1/2 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-900 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white group-hover:opacity-100 touch-target"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Pagination & Thumbnails */}
      {images.length > 1 && (
        <>
          <div className="md:hidden mt-2">
            <PaginationDots total={images.length} current={currentIndex} onDotClick={setCurrentIndex} />
          </div>
          <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-6">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(index)}
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-current={index === currentIndex}
                className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                  index === currentIndex ? "border-[#FF5F00] opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || "Thumbnail"}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
