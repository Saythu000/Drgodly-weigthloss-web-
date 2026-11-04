import { NextResponse } from "next/server";
import { FALLBACK_TRUST_CONTENT } from "@/lib/trust-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(FALLBACK_TRUST_CONTENT);
}
