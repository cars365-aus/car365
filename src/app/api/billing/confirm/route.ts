import { NextResponse, type NextRequest } from "next/server";
import { syncCheckoutSessionForOrganization } from "@/lib/billing/sync-checkout-session";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { requireApiUser } from "@/lib/security/auth";

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  let organizationId: string | undefined;
  let sessionId: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { organizationId?: string; sessionId?: string };
    organizationId = body.organizationId;
    sessionId = body.sessionId;
  } else {
    const formData = await request.formData();
    organizationId = formData.get("organizationId")?.toString();
    sessionId = formData.get("sessionId")?.toString();
  }

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  await ensureUserCanManageOrganization(user.id, organizationId);

  try {
    const result = await syncCheckoutSessionForOrganization(organizationId, sessionId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync subscription";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
