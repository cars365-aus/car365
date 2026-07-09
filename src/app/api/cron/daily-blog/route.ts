import { NextResponse } from "next/server";
import { publishDailyBlog } from "@/lib/blog/publish-daily";
import { optionalEnv } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = optionalEnv("CRON_SECRET")?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization")?.trim();
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: "Set CRON_SECRET in Vercel env (16+ chars, no newlines). Vercel cron sends Authorization: Bearer <CRON_SECRET>.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await publishDailyBlog();
    const status = result.ok ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
