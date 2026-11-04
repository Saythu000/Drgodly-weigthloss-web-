import { NextResponse } from "next/server";
import { getIntakeSessionId } from "@/lib/session-utils";
import { getPendingIntake } from "@/lib/intake-persistence";
import { calculatePersonalization } from "@/lib/personalization";
import { getDetectedRegion } from "@/lib/region-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionId = await getIntakeSessionId();
    const pending = await getPendingIntake(sessionId);
    const data = (pending?.data as Record<string, unknown>) || {};
    const { height, weight, goalWeight } = data;

    const region = await getDetectedRegion();

    const h = typeof height === "number" ? height : 170;
    const w = typeof weight === "number" ? weight : 85;
    const gw = typeof goalWeight === "number" ? goalWeight : 70;

    const result = calculatePersonalization(w, gw, h, data);

    return NextResponse.json({
      ...result,
      region,
    });
  } catch (error) {
    console.error("GET /api/personalization - Error:", error);
    return NextResponse.json({ error: "Failed to calculate personalization" }, { status: 500 });
  }
}
