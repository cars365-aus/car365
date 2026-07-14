import { permanentRedirect } from "next/navigation";

// Legacy rental "rules and guidelines" (driver eligibility, road rules) — not
// applicable to used-car sales. Consolidated into the Terms of Service.
export default function LegacyRulesRedirect() {
  permanentRedirect("/legal/terms");
}
