import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  return (
    <div className={cn("relative h-[56px] w-[220px] shrink-0", className)}>
      <Image
        src="/LOGO.png"
        alt="HireCar Marketplace"
        fill
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        sizes="(max-width: 640px) 180px, 220px"
        className={cn("object-contain", imageClassName)}
      />
    </div>
  );
}
