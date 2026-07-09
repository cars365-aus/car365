import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear the admin bypass session cookie so admin access is fully revoked
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  
  const url = new URL("/", request.url);
  return NextResponse.redirect(url, { status: 302 });
}
