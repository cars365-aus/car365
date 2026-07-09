import { NextResponse, type NextRequest } from "next/server";

export async function readJsonBody(request: NextRequest) {
  try {
    return { data: await request.json(), response: null };
  } catch {
    return {
      data: null,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

export async function readFormDataBody(request: NextRequest) {
  try {
    return { data: await request.formData(), response: null };
  } catch {
    return {
      data: null,
      response: NextResponse.json({ error: "Invalid form data" }, { status: 400 }),
    };
  }
}
