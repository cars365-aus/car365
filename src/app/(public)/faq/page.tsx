import { permanentRedirect } from "next/navigation";

// Legacy rental-era path; canonical FAQ now lives at /faqs.
export default function LegacyFaqRedirect() {
  permanentRedirect("/faqs");
}
