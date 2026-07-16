"use client";

import { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageIcon } from "lucide-react";

/**
 * Drop-in replacement for next/image that renders the image's `alt`
 * description inside the placeholder area when the image fails to load.
 *
 * Per the Next.js 16 Image API, `onError` requires a Client Component to
 * serialize the callback, so this wrapper is marked "use client".
 *
 * The fallback is positioned with `absolute inset-0` so it fills the same
 * box as a `fill` image (whose parent is already position: relative).
 *
 * @validates Requirements 12.5
 */
export function ImageWithFallback({ alt, onError, src, ...props }: ImageProps) {
  const [errored, setErrored] = useState(false);

  // Reset the error state if the source changes (e.g. gallery navigation),
  // so a previously-broken image doesn't keep showing the fallback.
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setErrored(false);
  }

  if (errored) {
    return (
      <div
        role="img"
        aria-label={typeof alt === "string" ? alt : undefined}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted p-4 text-center text-muted-foreground"
      >
        <ImageIcon className="h-8 w-8 shrink-0 text-slate-400" aria-hidden="true" />
        {typeof alt === "string" && alt.length > 0 && (
          <span className="line-clamp-3 text-xs font-medium leading-snug">
            {alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={(event) => {
        setErrored(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}
