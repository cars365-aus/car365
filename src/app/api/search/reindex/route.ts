import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/security/auth";
import { upsertVehicleDocument } from "@/lib/search/typesense";

export async function POST() {
  const { response } = await requireApiAdmin();
  if (response) return response;

  const result = await upsertVehicleDocument({
    id: "healthcheck",
    title: "Search reindex healthcheck",
    status: "ok",
  });

  return NextResponse.json({ ok: true, ...result });
}
