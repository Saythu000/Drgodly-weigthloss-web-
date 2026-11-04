import { NextRequest, NextResponse } from "next/server";
import { IntakeData, IntakeStep, StepValidators, getNextStep } from "@/lib/intake-state";
import { getIntakeSessionId } from "@/lib/session-utils";
import { getPendingIntake, updatePendingIntake, setPendingIntakeStep } from "@/lib/intake-persistence";
import { getDetectedRegion } from "@/lib/region-server";
import { ATTRIBUTION_COOKIE_NAME } from "@/lib/tracking/attribution";
import { dispatchServerConversion } from "@/lib/tracking/capi";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { step, answer } = await req.json();
    const sessionId = await getIntakeSessionId();

    if (!step || !Object.values(IntakeStep).includes(step as IntakeStep)) {
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    const pending = await getPendingIntake(sessionId);
    const currentStep = pending?.currentStep || IntakeStep.HEIGHT;

    if (step !== currentStep) {
      return NextResponse.json(
        { error: `Wrong step. Expected ${currentStep}` },
        { status: 400 }
      );
    }

    const validator = StepValidators[step as IntakeStep];
    if (!validator) {
      return NextResponse.json({ error: "No validator for step" }, { status: 500 });
    }

    const result = validator.safeParse(answer);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    let answerToStore = result.data;
    const region = await getDetectedRegion();

    // Unit Conversion for Imperial Regions
    if (region.system === "imperial" && typeof answerToStore === "number") {
      const { units } = await import("@/lib/region-shared");
      if (step === IntakeStep.HEIGHT) {
        answerToStore = units.inchesToCm(answerToStore);
      } else if (step === IntakeStep.WEIGHT || step === IntakeStep.GOAL_WEIGHT) {
        answerToStore = units.lbsToKg(answerToStore);
      }
    }

    const updatedPending = await updatePendingIntake(
      sessionId,
      step as IntakeStep,
      answerToStore
    );

    const intakeData = updatedPending.data as unknown as IntakeData;
    const nextStep = getNextStep(step as IntakeStep, intakeData);

    if (nextStep !== IntakeStep.COMPLETED) {
      await setPendingIntakeStep(sessionId, nextStep);
    } else {
      // When completed, automatically sync lead into CRM database
      try {
        if (intakeData.phone) {
          const fullName = `${intakeData.firstName || ""} ${intakeData.lastName || ""}`.trim();
          const heightM = typeof intakeData.height === "number" ? intakeData.height / 100 : 1.7;
          const bmi = typeof intakeData.weight === "number" ? Number((intakeData.weight / (heightM * heightM)).toFixed(1)) : null;

          // Read attribution cookie if present
          const attrCookie = req.cookies.get(ATTRIBUTION_COOKIE_NAME)?.value;
          let attributionData: any = null;
          if (attrCookie) {
            try {
              attributionData = JSON.parse(attrCookie);
            } catch (e) {}
          }

          const healthFlagsPayload = {
            criticalFlags: intakeData.healthCritical || [],
            extendedFlags: intakeData.healthExtended || [],
            attribution: attributionData || undefined,
          };

          await prisma.lead.upsert({
            where: { phoneNumber: intakeData.phone },
            update: {
              name: fullName || undefined,
              bmi: bmi || undefined,
              preferredMedication: intakeData.formFactor?.toUpperCase() || "TABLET",
              category: "CUSTOMER",
              intakeStatus: "DOCTOR_REVIEW",
              healthFlags: healthFlagsPayload,
            },
            create: {
              phoneNumber: intakeData.phone,
              name: fullName || "Web Patient",
              bmi: bmi || undefined,
              preferredMedication: intakeData.formFactor?.toUpperCase() || "TABLET",
              category: "CUSTOMER",
              intakeStatus: "DOCTOR_REVIEW",
              healthFlags: healthFlagsPayload,
            },
          });

          // Also persist/sync to prisma.intake table for doctor review & EHR
          try {
            await prisma.intake.create({
              data: {
                userId: `user-${intakeData.phone}`,
                firstName: intakeData.firstName || "",
                lastName: intakeData.lastName || "",
                email: intakeData.email || "",
                phone: intakeData.phone,
                shippingState: intakeData.shippingState || "",
                height: typeof intakeData.height === "number" ? intakeData.height : null,
                weight: typeof intakeData.weight === "number" ? intakeData.weight : null,
                goalWeight: typeof intakeData.goalWeight === "number" ? intakeData.goalWeight : null,
                gender: intakeData.gender || "",
                dateOfBirth: intakeData.dateOfBirth ? new Date(intakeData.dateOfBirth) : null,
                healthData: {
                  bloodPressure: intakeData.bloodPressure,
                  heartRate: intakeData.heartRate,
                  critical: intakeData.healthCritical,
                  extended: intakeData.healthExtended,
                },
                history: {
                  medicationHistory: intakeData.medicationHistory,
                  programHistory: intakeData.programHistory,
                },
                preferences: {
                  formFactor: intakeData.formFactor,
                  primaryInterest: intakeData.primaryInterest,
                  attribution: attributionData || undefined,
                },
                additionalInfo: intakeData.additionalInfoDetails || "",
              },
            });
          } catch (intakeDbError) {
            console.warn("Non-fatal error creating intake record:", intakeDbError);
          }

          // Trigger HIPAA-compliant server-side conversion event (Meta CAPI & Google Ads)
          try {
            await dispatchServerConversion({
              eventName: 'Lead',
              userEmail: intakeData.email,
              userPhone: intakeData.phone,
              clientIp: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
              clientUserAgent: req.headers.get('user-agent') || undefined,
              attribution: attributionData,
              customData: {
                content_category: 'medical_weight_loss',
                status: 'doctor_review',
              },
            });
          } catch (capiError) {
            console.warn("Non-fatal error dispatching CAPI conversion:", capiError);
          }
        }
      } catch (leadError) {
        console.warn("Non-fatal error creating CRM lead from intake:", leadError);
      }
    }

    return NextResponse.json({
      success: true,
      nextStep,
      intakeData,
    });
  } catch (error) {
    console.error("POST /api/intake/answer - Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
