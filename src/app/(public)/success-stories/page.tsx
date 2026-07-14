import { permanentRedirect } from "next/navigation";

// Legacy rental-operator "success stories" page; customer reviews now live at /testimonials.
export default function LegacySuccessStoriesRedirect() {
  permanentRedirect("/testimonials");
}
