import React from "react";
import { Clock, FileText, CheckCircle, XCircle, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface DoctorOnboardingStatusProps {
  status: string;
  rejectionReason?: string | null;
  onEdit: () => void;
  practitionerId?: string;
}

export default function DoctorOnboardingStatus({
  status,
  rejectionReason,
  onEdit,
  practitionerId,
}: DoctorOnboardingStatusProps) {
  const lowerStatus = (status || "").toLowerCase();

  return (
    <div className="min-h-screen bg-zinc-50 py-16 px-6 dark:bg-black">
      <div className="mx-auto max-w-2xl text-center space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">DrGodly Platform</p>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Doctor Onboarding
          </h1>
        </header>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-left space-y-6">
          {lowerStatus === "draft" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-amber-600 dark:text-amber-400">
                <FileText className="h-8 w-8" />
                <h2 className="text-2xl font-bold">Application Draft</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Your onboarding profile is currently saved as a draft. You can continue filling out your qualifications, specialties, location assignments, and submit it for administrator review when you are ready.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Resume Application
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {(lowerStatus === "submitted" || lowerStatus === "under_review") && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-blue-600 dark:text-blue-400">
                <Clock className="h-8 w-8 animate-pulse" />
                <h2 className="text-2xl font-bold">Under Review</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Your onboarding profile has been submitted and is currently being reviewed by our clinical administration team. We will verify your medical credentials, licensing details, and organization affiliations.
              </p>
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950 text-xs text-zinc-500">
                Average review times are currently 24-48 business hours. You will receive an email confirmation once the process is complete.
              </div>
              <div className="pt-4 flex gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
                {practitionerId && (
                  <a
                    href={`/api/fhir/Practitioner/${practitionerId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    View FHIR Draft
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {(lowerStatus === "approved" || lowerStatus === "verified") && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-green-600 dark:text-green-400">
                <CheckCircle className="h-8 w-8" />
                <h2 className="text-2xl font-bold">Approved & Verified</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Congratulations! Your medical credentials have been verified and your profile is approved. You have been upgraded to the Practitioner role on the platform. You may now access the EMR dashboard to review consultations and consult patients.
              </p>
              <div className="rounded-2xl bg-green-50/50 p-4 border border-green-100 dark:bg-green-950/20 dark:border-green-900/30 text-xs text-green-800 dark:text-green-300 space-y-2">
                <p className="font-bold">Interoperability Export Available</p>
                <p>Your record is indexed in our FHIR R4 interoperability layer. You can view your record schema here:</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={`/api/fhir/Practitioner/${practitionerId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-mono inline-flex items-center gap-1 hover:text-green-600"
                  >
                    Practitioner Resource
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {lowerStatus === "rejected" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-red-600 dark:text-red-400">
                <XCircle className="h-8 w-8" />
                <h2 className="text-2xl font-bold">Needs Attention</h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Your onboarding application has been returned for adjustments. Please review the reviewer feedback below, make the necessary corrections, and re-submit your profile.
              </p>
              
              <div className="rounded-2xl bg-red-50 p-5 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wide dark:text-red-400">Admin Reviewer Feedback</p>
                <p className="mt-2 text-sm text-red-900 dark:text-red-300 font-medium">
                  {rejectionReason || "Please verify your licensing credentials and uploaded document files."}
                </p>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Edit & Re-submit Profile
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
