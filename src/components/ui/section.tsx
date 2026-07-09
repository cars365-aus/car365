import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sectionVariants = cva("w-full", {
  variants: {
    variant: {
      default: "bg-background",
      muted: "bg-muted",
      navy: "bg-[#0f172a] text-white",
      gradient: "bg-gradient-to-b from-white to-slate-50",
    },
    size: {
      sm: "py-8 md:py-12",
      md: "py-12 md:py-16",
      lg: "py-16 md:py-24",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

interface SectionProps
  extends React.ComponentProps<"section">,
    VariantProps<typeof sectionVariants> {
  container?: boolean
}

function Section({
  className,
  variant,
  size,
  container = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ variant, size }), className)}
      {...props}
    >
      {container ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  )
}

export { Section, sectionVariants }
