import { describe, it, expect } from "vitest"
import { buttonVariants } from "./button"

describe("buttonVariants", () => {
  describe("cta size variant", () => {
    it("includes h-11 for 44px height touch target", () => {
      const classes = buttonVariants({ size: "cta" })
      expect(classes).toContain("h-11")
    })

    it("includes gap-2 for icon/text spacing", () => {
      const classes = buttonVariants({ size: "cta" })
      expect(classes).toContain("gap-2")
    })

    it("includes px-6 horizontal padding", () => {
      const classes = buttonVariants({ size: "cta" })
      expect(classes).toContain("px-6")
    })

    it("includes text-base font size", () => {
      const classes = buttonVariants({ size: "cta" })
      expect(classes).toContain("text-base")
    })

    it("includes font-bold weight", () => {
      const classes = buttonVariants({ size: "cta" })
      expect(classes).toContain("font-bold")
    })

    it("includes rounded-lg border radius", () => {
      const classes = buttonVariants({ size: "cta" })
      expect(classes).toContain("rounded-lg")
    })
  })

  describe("variant states", () => {
    it("default variant includes hover state", () => {
      const classes = buttonVariants({ variant: "default" })
      expect(classes).toContain("hover:bg-primary/90")
    })

    it("default variant includes active state", () => {
      const classes = buttonVariants({ variant: "default" })
      expect(classes).toContain("active:bg-primary/80")
    })

    it("default variant uses primary token colors", () => {
      const classes = buttonVariants({ variant: "default" })
      expect(classes).toContain("bg-primary")
      expect(classes).toContain("text-primary-foreground")
    })

    it("all variants include disabled state from base", () => {
      const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const
      for (const variant of variants) {
        const classes = buttonVariants({ variant })
        expect(classes).toContain("disabled:pointer-events-none")
        expect(classes).toContain("disabled:opacity-50")
      }
    })

    it("all variants include focus-visible ring from base", () => {
      const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const
      for (const variant of variants) {
        const classes = buttonVariants({ variant })
        expect(classes).toContain("focus-visible:ring-3")
      }
    })

    it("all variants include active translate from base", () => {
      const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const
      for (const variant of variants) {
        const classes = buttonVariants({ variant })
        expect(classes).toContain("active:not-aria-[haspopup]:translate-y-px")
      }
    })

    it("outline variant includes hover and active states", () => {
      const classes = buttonVariants({ variant: "outline" })
      expect(classes).toContain("hover:bg-muted")
      expect(classes).toContain("active:bg-muted/80")
    })

    it("secondary variant includes hover and active states", () => {
      const classes = buttonVariants({ variant: "secondary" })
      expect(classes).toContain("hover:bg-secondary/80")
      expect(classes).toContain("active:bg-secondary/70")
    })

    it("ghost variant includes hover and active states", () => {
      const classes = buttonVariants({ variant: "ghost" })
      expect(classes).toContain("hover:bg-muted")
      expect(classes).toContain("active:bg-muted/80")
    })

    it("destructive variant includes hover and active states", () => {
      const classes = buttonVariants({ variant: "destructive" })
      expect(classes).toContain("hover:bg-destructive/20")
      expect(classes).toContain("active:bg-destructive/30")
    })

    it("link variant includes hover and active states", () => {
      const classes = buttonVariants({ variant: "link" })
      expect(classes).toContain("hover:underline")
      expect(classes).toContain("active:text-primary/80")
    })
  })

  describe("cta size combined with variants", () => {
    it("cta size works with default variant", () => {
      const classes = buttonVariants({ variant: "default", size: "cta" })
      expect(classes).toContain("h-11")
      expect(classes).toContain("bg-primary")
      expect(classes).toContain("text-primary-foreground")
    })

    it("cta size works with outline variant", () => {
      const classes = buttonVariants({ variant: "outline", size: "cta" })
      expect(classes).toContain("h-11")
      expect(classes).toContain("border-border")
    })

    it("cta size works with destructive variant", () => {
      const classes = buttonVariants({ variant: "destructive", size: "cta" })
      expect(classes).toContain("h-11")
      expect(classes).toContain("text-destructive")
    })
  })
})
