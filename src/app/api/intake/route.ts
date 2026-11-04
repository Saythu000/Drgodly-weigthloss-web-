import { NextResponse } from "next/server";
import { getIntakeSessionId, setIntakeSessionId } from "@/lib/session-utils";
import { getPendingIntake, deletePendingIntake } from "@/lib/intake-persistence";
import { IntakeStep } from "@/lib/intake-state";
import { getDetectedRegion } from "@/lib/region-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionId = await getIntakeSessionId();
    let pending = await getPendingIntake(sessionId);

    if (pending?.currentStep === IntakeStep.COMPLETED) {
      await deletePendingIntake(sessionId);
      pending = null;
    }

    const region = await getDetectedRegion();

    const response = NextResponse.json({
      currentStep: pending?.currentStep || IntakeStep.HEIGHT,
      data: pending?.data || {},
      region,
    });

    // Ensure session cookie is attached
    response.cookies.set("drgodly_intake_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GET /api/intake - Error:", error);
    return NextResponse.json(
      {
        currentStep: IntakeStep.HEIGHT,
        data: {},
        region: { country: "IN", currency: "INR", system: "metric", locale: "en-IN" },
      },
      { status: 200 }
    );
  }
}

export async function DELETE() {
  try {
    const sessionId = await getIntakeSessionId();
    await deletePendingIntake(sessionId);
    return NextResponse.json({ message: "Intake reset" });
  } catch (error) {
    console.error("DELETE /api/intake - Error:", error);
    return NextResponse.json({ message: "Intake reset" });
  }
}
