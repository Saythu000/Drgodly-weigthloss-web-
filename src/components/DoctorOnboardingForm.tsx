"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2, Upload, Save, Check, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DoctorOnboardingSchema,
  DoctorOnboardingSubmitSchema,
  formatZodError,
  StructuredValidationError
} from "@/lib/onboarding-validation";

// Available lookup structures from server
interface LookupItem {
  id: string;
  name: string;
}

interface LookupLocation {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface LookupService {
  id: string;
  name: string;
  type: string;
}

interface LookupData {
  organizations: LookupItem[];
  locations: LookupLocation[];
  services: LookupService[];
}

const STEPS = [
  { num: 1, title: "Personal Info", desc: "Basic demographic details" },
  { num: 2, title: "Contact Info", desc: "Primary contact channels" },
  { num: 3, title: "Medical Registration", desc: "Medical licenses & registries" },
  { num: 4, title: "Qualifications", desc: "Degrees & education credentials" },
  { num: 5, title: "Specialty & Expertise", desc: "SNOMED specialties selection" },
  { num: 6, title: "Practice & Organizations", desc: "Clinical organization roles" },
  { num: 7, title: "Languages", desc: "Consultation languages" },
  { num: 8, title: "Telemedicine Services", desc: "Clinical service configurations" },
  { num: 9, title: "Pricing", desc: "Fees & currency settings" },
  { num: 10, title: "Availability", desc: "Weekly working slots" },
  { num: 11, title: "Professional Profile", desc: "Bio & clinical experience" },
  { num: 12, title: "Verification Documents", desc: "Verify credential documents" },
  { num: 13, title: "Consent & Review", desc: "Final review & submission" },
];

const INITIAL_FORM_DATA = {
  title: "Dr.",
  firstName: "",
  middleName: "",
  lastName: "",
  displayName: "",
  gender: "male",
  birthDate: "",
  email: "",
  phone: "",
  alternatePhone: "",
  preferredContactMethod: "email",
  identifiers: [] as any[],
  qualifications: [] as any[],
  specialties: [] as any[],
  roles: [] as any[],
  languages: [] as any[],
  professionalBio: "",
  yearsOfExperience: 0,
  documents: [] as any[],
  consent: {
    platformTermsAccepted: false,
    privacyPolicyAccepted: false,
    telemedicineTermsAccepted: false,
    aiAssistanceAcknowledgement: false,
    clinicalResponsibilityAcknowledgement: false,
  }
};

const LANGUAGES_OPTIONS = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "te", name: "Telugu" },
  { code: "ta", name: "Tamil" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" }
];

const SPECIALTY_OPTIONS = [
  { code: "408443003", display: "General Medical Practice" },
  { code: "394814009", display: "Cardiology" },
  { code: "394582007", display: "Dermatology" },
  { code: "394583002", display: "Endocrinology" },
  { code: "394802001", display: "General Medicine" },
  { code: "394589003", display: "Pediatrics" },
  { code: "394801008", display: "Internal Medicine" }
];

export default function DoctorOnboardingForm({ userRole = "user" }: { userRole?: string } = {}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [lookups, setLookups] = useState<LookupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<string>("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorsList, setSubmitErrorsList] = useState<StructuredValidationError[]>([]);
  const [practitionerId, setPractitionerId] = useState<string>("");
  const [blockingIssues, setBlockingIssues] = useState<StructuredValidationError[]>([]);
  const [rejectionFeedback, setRejectionFeedback] = useState<string | null>(null);
  const [fhirPreview, setFhirPreview] = useState<any>(null);
  const [showFhirPreview, setShowFhirPreview] = useState(false);
  const [submitStage, setSubmitStage] = useState<"review" | "confirm" | "submitting" | "complete">("review");
  const [progressIndex, setProgressIndex] = useState(-1);
  const formRef = useRef<HTMLDivElement>(null);

  // Initialize React Hook Form
  const methods = useForm<any>({
    resolver: zodResolver(step === 13 ? DoctorOnboardingSubmitSchema : DoctorOnboardingSchema),
    defaultValues: INITIAL_FORM_DATA,
    mode: "onBlur"
  });

  const { 
    register, 
    control, 
    handleSubmit, 
    setValue, 
    getValues, 
    watch, 
    trigger, 
    formState: { errors, isDirty } 
  } = methods;

  // Manage field arrays using react-hook-form
  const { fields: identifierFields, append: appendIdentifier, remove: removeIdentifier } = useFieldArray({
    control,
    name: "identifiers"
  });

  const { fields: qualificationFields, append: appendQualification, remove: removeQualification } = useFieldArray({
    control,
    name: "qualifications"
  });

  const { fields: specialtyFields, append: appendSpecialty, remove: removeSpecialty } = useFieldArray({
    control,
    name: "specialties"
  });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: "languages"
  });

  const { fields: roleFields, append: appendRole, remove: removeRole } = useFieldArray({
    control,
    name: "roles"
  });



  const watchedRoles = watch("roles") || [];

  // Prevent navigating away if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Load lookup data and existing draft onboarding profile
  useEffect(() => {
    async function loadData() {
      try {
        const lookupRes = await fetch("/api/onboarding/lookups");
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          setLookups(lookupData);
        }

        const draftRes = await fetch("/api/onboarding");
        if (draftRes.ok) {
          const draftData = await draftRes.json();
          if (draftData.id) {
            setPractitionerId(draftData.id);
          }
          if (draftData.rejectionReason) {
            setRejectionFeedback(draftData.rejectionReason);
          }
          if (
            draftData.status === "submitted" ||
            draftData.status === "approved" ||
            draftData.status === "SUBMITTED" ||
            draftData.status === "VERIFIED"
          ) {
            router.push("/onboarding/status");
            return;
          }
          if (draftData.data) {
            // Populate form with existing data
            const fetched = draftData.data;
            Object.keys(fetched).forEach((key) => {
              if (fetched[key] !== undefined && fetched[key] !== null) {
                setValue(key, fetched[key]);
              }
            });
            if (fetched.birthDate) {
              setValue("birthDate", fetched.birthDate.split("T")[0]);
            }
          }
        }
      } catch (err) {
        console.error("Error loading onboarding data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router, setValue]);

  // Dynamic validation checks for step 13
  useEffect(() => {
    if (step === 13) {
      const data = getValues();
      const result = DoctorOnboardingSubmitSchema.safeParse(data);
      if (!result.success) {
        setBlockingIssues(formatZodError(result.error));
      } else {
        setBlockingIssues([]);
      }
    }
  }, [step, watch()]);

  // Load FHIR R4 Preview for admins
  useEffect(() => {
    if (step === 13 && userRole === "admin") {
      fetch("/api/onboarding/fhir-preview")
        .then((res) => res.json())
        .then((data) => setFhirPreview(data))
        .catch((err) => console.error("Error loading FHIR preview:", err));
    }
  }, [step, userRole]);

  // Explicit save draft function
  const saveDraft = async (showToast = true) => {
    setSaving(true);
    setSavingStatus("saving");
    setSubmitError(null);
    try {
      const currentValues = getValues();
      
      const cleanData = { ...currentValues };
      
      if (Array.isArray(cleanData.identifiers)) {
        cleanData.identifiers = cleanData.identifiers.filter((i: any) => i && i.value && i.value.trim() !== "");
      }
      if (Array.isArray(cleanData.qualifications)) {
        cleanData.qualifications = cleanData.qualifications.filter((q: any) => q && q.degreeName && q.degreeName.trim() !== "");
      }
      if (Array.isArray(cleanData.specialties)) {
        cleanData.specialties = cleanData.specialties.filter((s: any) => s && s.specialtyCode && s.specialtyCode.trim() !== "");
      }
      if (Array.isArray(cleanData.languages)) {
        cleanData.languages = cleanData.languages.filter((l: any) => l && l.languageCode && l.languageCode.trim() !== "");
      }
      if (Array.isArray(cleanData.roles)) {
        cleanData.roles = cleanData.roles.map((r: any) => {
          if (!r) return null;
          const cleanRole = { ...r };
          if (Array.isArray(cleanRole.services)) {
            cleanRole.services = cleanRole.services.filter((s: any) => s && s.serviceCode && s.serviceCode.trim() !== "");
          }
          if (Array.isArray(cleanRole.availabilities)) {
            cleanRole.availabilities = cleanRole.availabilities.filter((a: any) => a && a.availableFrom && a.availableFrom.trim() !== "");
          }
          return cleanRole;
        }).filter((r: any) => r && r.organizationId && r.organizationId.trim() !== "");
      }
      if (Array.isArray(cleanData.documents)) {
        cleanData.documents = cleanData.documents.filter((d: any) => d && d.url && d.url.trim() !== "");
      }

      const parsedDraft = DoctorOnboardingSchema.safeParse(cleanData);
      
      const payload = parsedDraft.success ? parsedDraft.data : cleanData;

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavingStatus("saved");
        const time = new Date().toLocaleTimeString();
        setLastSaved(time);
        if (showToast) {
          setTimeout(() => setSavingStatus("idle"), 2500);
        }
        return true;
      } else {
        setSavingStatus("error");
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setSavingStatus("error");
    } finally {
      setSaving(false);
    }
    return false;
  };

  // Document File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(docType);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/onboarding/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const fileMetadata = await res.json();
        // Remove duplicate of same doctype if exists, then append
        const filteredDocs = (getValues("documents") || []).filter((d: any) => d.docType !== docType);
        setValue("documents", [
          ...filteredDocs,
          {
            title: fileMetadata.title,
            url: fileMetadata.url,
            docType,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }
        ]);
        await saveDraft(false);
      } else {
        alert("File upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(null);
    }
  };

  // Validate only fields on the current step
  const validateStep = async () => {
    let fieldsToValidate: string[] = [];

    if (step === 1) {
      fieldsToValidate = ["title", "firstName", "lastName", "displayName", "gender", "birthDate"];
    } else if (step === 2) {
      fieldsToValidate = ["email", "phone", "alternatePhone", "preferredContactMethod"];
    } else if (step === 3) {
      fieldsToValidate = ["identifiers"];
    } else if (step === 4) {
      fieldsToValidate = ["qualifications"];
    } else if (step === 5) {
      fieldsToValidate = ["specialties"];
    } else if (step === 6) {
      fieldsToValidate = ["roles"];
    } else if (step === 7) {
      fieldsToValidate = ["languages"];
    } else if (step === 8) {
      fieldsToValidate = ["roles"];
    } else if (step === 9) {
      fieldsToValidate = ["roles"];
    } else if (step === 10) {
      fieldsToValidate = ["roles"];
    } else if (step === 11) {
      fieldsToValidate = ["professionalBio", "yearsOfExperience"];
    } else if (step === 12) {
      fieldsToValidate = ["documents"];
    } else if (step === 13) {
      fieldsToValidate = ["consent"];
    }

    const isValid = await trigger(fieldsToValidate);
    
    // Focus first invalid element
    if (!isValid) {
      setTimeout(() => {
        const firstErrorEl = formRef.current?.querySelector('[aria-invalid="true"]');
        if (firstErrorEl) {
          (firstErrorEl as HTMLElement).focus();
        }
      }, 50);
    }

    return isValid;
  };

  const handleNext = async () => {
    const isStepValid = await validateStep();
    if (isStepValid) {
      await saveDraft(false);
      setStep((prev) => Math.min(prev + 1, 13));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getErrorNavigation = (path: string): { step: number; field: string } => {
    if (path.startsWith("consent")) return { step: 13, field: "consent" };
    if (path.startsWith("documents")) return { step: 12, field: "documents" };
    if (path.includes("professionalBio") || path.includes("yearsOfExperience")) return { step: 11, field: path };
    if (path.includes("availabilities")) return { step: 10, field: "roles" };
    if (path.includes("fee") || path.includes("currency")) return { step: 9, field: "roles" };
    if (path.includes("services")) return { step: 8, field: "roles" };
    if (path.includes("languages")) return { step: 7, field: "languages" };
    if (path.includes("organization") || path.includes("locations") || path.startsWith("roles")) return { step: 6, field: "roles" };
    if (path.includes("specialties")) return { step: 5, field: "specialties" };
    if (path.includes("qualifications")) return { step: 4, field: "qualifications" };
    if (path.includes("identifiers")) return { step: 3, field: "identifiers" };
    if (path.includes("email") || path.includes("phone")) return { step: 2, field: path };
    return { step: 1, field: path };
  };

  const startSubmissionProcess = async () => {
    setSubmitStage("submitting");
    setProgressIndex(0);

    const stages = [
      "Submitting...",
      "Validating credentials...",
      "Creating provider profile...",
      "Preparing interoperability resources...",
      "Complete"
    ];

    for (let idx = 0; idx < stages.length; idx++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgressIndex(idx);
    }

    try {
      const submitRes = await fetch("/api/onboarding/submit", {
        method: "POST",
      });

      if (submitRes.ok) {
        setSubmitStage("complete");
      } else {
        const errData = await submitRes.json();
        setSubmitError(errData.error || "Submission failed. Please check inputs.");
        setSubmitStage("review");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred during submission.");
      setSubmitStage("review");
    }
  };

  const onFinalSubmit = async (data: any) => {
    setSubmitError(null);
    setSubmitErrorsList([]);
    
    // 1. Strict validation check locally first
    const validationCheck = DoctorOnboardingSubmitSchema.safeParse(data);
    if (!validationCheck.success) {
      const structuredErrors = formatZodError(validationCheck.error);
      setSubmitErrorsList(structuredErrors);
      setSubmitError("Strict submission validation failed. Please check the review steps below.");
      return;
    }

    // 2. Persist draft one final time
    const draftSaved = await saveDraft(false);
    if (!draftSaved) {
      setSubmitError("Failed to save final draft progress before submission.");
      return;
    }

    setSubmitStage("confirm");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent dark:border-emerald-500"></div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-zinc-50 py-8 px-4 dark:bg-zinc-950 sm:px-6 sm:py-12" ref={formRef}>
        <div className="mx-auto max-w-4xl space-y-6">
          
          {/* Form Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5 dark:border-zinc-800">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Practitioner registry</p>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50">Doctor Onboarding</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Draft Status Pill */}
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-600 shadow-sm border border-zinc-200/60 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800">
                <span className={`h-2.5 w-2.5 rounded-full ${savingStatus === "saving" ? "bg-amber-500 animate-pulse" : savingStatus === "saved" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                {savingStatus === "saving" && "Saving..."}
                {savingStatus === "saved" && "Saved"}
                {savingStatus === "idle" && "Draft Mode"}
                {savingStatus === "error" && "Save Error"}
                {lastSaved && <span className="text-zinc-400 dark:text-zinc-500 font-normal">({lastSaved})</span>}
              </div>

              <button
                type="button"
                onClick={() => saveDraft(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:scale-[0.99] transition-transform dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </button>
            </div>
          </header>

          {/* Rejection/Change Request Banner */}
          {rejectionFeedback && (
            <div className="rounded-3xl border border-amber-250 bg-amber-50/50 p-6 space-y-4 dark:border-amber-900/30 dark:bg-amber-950/10 text-left">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider">Review Corrections Required</h3>
              </div>
              <p className="text-xs text-zinc-550 dark:text-zinc-400">
                An administrator has requested corrections to your onboarding application. Please review the details below and update the corresponding fields:
              </p>

              {(() => {
                try {
                  const parsed = JSON.parse(rejectionFeedback);
                  if (Array.isArray(parsed)) {
                    return (
                      <div className="space-y-2 text-xs">
                        {parsed.map((item: any, idx: number) => {
                          const nav = getErrorNavigation(item.field);
                          return (
                            <div key={idx} className="flex justify-between items-center bg-white border border-amber-150 rounded-xl p-3.5 dark:bg-zinc-950 dark:border-zinc-800">
                              <div>
                                <span className="font-bold text-amber-800 uppercase tracking-wider dark:text-amber-400 mr-2">{item.field}:</span>
                                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{item.reason}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setStep(nav.step);
                                  setTimeout(() => {
                                    const el = document.getElementById(nav.field) || document.querySelector(`[name="${nav.field}"]`);
                                    if (el) {
                                      el.scrollIntoView({ behavior: "smooth" });
                                      (el as HTMLElement).focus();
                                    }
                                  }, 150);
                                }}
                                className="text-xs font-bold text-emerald-600 hover:underline shrink-0 ml-4"
                              >
                                Go to Step {nav.step}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                } catch (e) {
                  // Fallback
                }
                return (
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-white border border-amber-100 p-4 rounded-xl dark:bg-zinc-950 dark:border-zinc-800">
                    {rejectionFeedback}
                  </p>
                );
              })()}
            </div>
          )}

          {/* Progress Header */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900/60 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-zinc-500 uppercase tracking-wide">
                Step {step} of 13
              </span>
              <span className="font-extrabold text-zinc-900 dark:text-zinc-50">
                {STEPS[step - 1].title}
              </span>
            </div>
            <div className="relative h-2 w-full bg-zinc-100 rounded-full dark:bg-zinc-800">
              <div 
                className="absolute left-0 top-0 h-2 bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / 13) * 100}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 font-medium">{STEPS[step - 1].desc}</p>
          </div>

          {/* Form Step Container */}
          <form onSubmit={handleSubmit(onFinalSubmit)} className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-850 dark:bg-zinc-900/40 backdrop-blur-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  
                  {/* STEP 1: PERSONAL INFORMATION */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Personal Information</h2>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Title</label>
                          <select
                            id="title"
                            {...register("title")}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <option value="Dr.">Dr.</option>
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Prof.">Prof.</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-zinc-500">First Name</label>
                          <input
                            id="firstName"
                            type="text"
                            aria-invalid={!!errors.firstName}
                            {...register("firstName")}
                            placeholder="Alexis"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.firstName && <p className="text-xs text-red-500 font-semibold">{errors.firstName.message?.toString()}</p>}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="middleName" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Middle Name (Optional)</label>
                          <input
                            id="middleName"
                            type="text"
                            {...register("middleName")}
                            placeholder="Marie"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Last Name</label>
                          <input
                            id="lastName"
                            type="text"
                            aria-invalid={!!errors.lastName}
                            {...register("lastName")}
                            placeholder="Carter"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.lastName && <p className="text-xs text-red-500 font-semibold">{errors.lastName.message?.toString()}</p>}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="displayName" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Display Name</label>
                          <input
                            id="displayName"
                            type="text"
                            aria-invalid={!!errors.displayName}
                            {...register("displayName")}
                            placeholder="Dr. Alexis Carter"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.displayName && <p className="text-xs text-red-500 font-semibold">{errors.displayName.message?.toString()}</p>}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Gender</label>
                          <select
                            id="gender"
                            {...register("gender")}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="unknown">Prefer not to say</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="birthDate" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Date of Birth</label>
                          <input
                            id="birthDate"
                            type="date"
                            aria-invalid={!!errors.birthDate}
                            {...register("birthDate")}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.birthDate && <p className="text-xs text-red-500 font-semibold">{errors.birthDate.message?.toString()}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CONTACT INFORMATION */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Contact Information</h2>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
                          <input
                            id="email"
                            type="email"
                            aria-invalid={!!errors.email}
                            {...register("email")}
                            placeholder="doctor@example.com"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.email && <p className="text-xs text-red-500 font-semibold">{errors.email.message?.toString()}</p>}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mobile Phone (E.164 format)</label>
                          <input
                            id="phone"
                            type="text"
                            aria-invalid={!!errors.phone}
                            {...register("phone")}
                            placeholder="+919876543210"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone.message?.toString()}</p>}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="alternatePhone" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Alternate Phone (Optional)</label>
                          <input
                            id="alternatePhone"
                            type="text"
                            {...register("alternatePhone")}
                            placeholder="+919876543211"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="preferredContactMethod" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Preferred Contact Method</label>
                          <select
                            id="preferredContactMethod"
                            {...register("preferredContactMethod")}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <option value="email">Email</option>
                            <option value="phone">Voice Call</option>
                            <option value="sms">SMS</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: MEDICAL REGISTRATION / IDENTIFIERS */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Medical Registration</h2>
                          <p className="text-xs text-zinc-400 mt-1">Provide unique identifiers, licenses, or councils registration keys.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => appendIdentifier({ system: "https://www.nmc.org.in", value: "", type: "StateLicense", use: "official", issuer: "" })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Identifier
                        </button>
                      </div>

                      {errors.identifiers && (
                        <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-500 font-semibold dark:bg-red-950/20 dark:border-red-900/30">
                          {errors.identifiers.message?.toString() || "Please correct identifier details."}
                        </div>
                      )}

                      <div className="space-y-4">
                        {identifierFields.map((field, idx) => (
                          <div 
                            key={field.id} 
                            className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20 space-y-4 relative"
                          >
                            <button
                              type="button"
                              onClick={() => removeIdentifier(idx)}
                              className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
                              aria-label="Remove identifier"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Identifier Type</label>
                                <select
                                  {...register(`identifiers.${idx}.type`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                  <option value="StateLicense">State Medical License</option>
                                  <option value="NMC">NMC Registration</option>
                                  <option value="NPI">National Provider Identifier (NPI)</option>
                                  <option value="USMLE">USMLE Certificate</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Registration Number / Value</label>
                                <input
                                  type="text"
                                  placeholder="MCI-99887"
                                  {...register(`identifiers.${idx}.value`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Authority Issuer</label>
                                <input
                                  type="text"
                                  placeholder="Karnataka Medical Council"
                                  {...register(`identifiers.${idx}.issuer`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2 sm:col-span-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Registry System URL</label>
                                <input
                                  type="text"
                                  placeholder="https://www.nmc.org.in"
                                  {...register(`identifiers.${idx}.system`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {identifierFields.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            No medical registrations added. Click Add Identifier above.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: QUALIFICATIONS */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Qualifications & Education</h2>
                          <p className="text-xs text-zinc-400 mt-1">Provide medical degree records (at least one is required).</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => appendQualification({ qualificationType: "PG", degreeName: "", specialization: "", institution: "", issuingOrganization: "", country: "", completionDate: "", certificateNumber: "" })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Qualification
                        </button>
                      </div>

                      {errors.qualifications && (
                        <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-500 font-semibold dark:bg-red-950/20 dark:border-red-900/30">
                          {errors.qualifications.message?.toString() || "At least one qualification is required before submission."}
                        </div>
                      )}

                      <div className="space-y-4">
                        {qualificationFields.map((field, idx) => (
                          <div 
                            key={field.id} 
                            className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20 space-y-4 relative"
                          >
                            <button
                              type="button"
                              onClick={() => removeQualification(idx)}
                              className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
                              aria-label="Remove qualification"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Degree Level</label>
                                <select
                                  {...register(`qualifications.${idx}.qualificationType`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                  <option value="UG">Undergraduate (e.g. MBBS)</option>
                                  <option value="PG">Postgraduate (e.g. MD / MS)</option>
                                  <option value="SuperSpecialty">Super Specialty (e.g. DM)</option>
                                  <option value="Diploma">Diploma</option>
                                  <option value="Fellowship">Fellowship</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Degree Name</label>
                                <input
                                  type="text"
                                  placeholder="MBBS / MD"
                                  {...register(`qualifications.${idx}.degreeName`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Specialization</label>
                                <input
                                  type="text"
                                  placeholder="Family Medicine"
                                  {...register(`qualifications.${idx}.specialization`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Institution / College</label>
                                <input
                                  type="text"
                                  placeholder="Madras Medical College"
                                  {...register(`qualifications.${idx}.institution`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Issuing Board / University</label>
                                <input
                                  type="text"
                                  placeholder="Dr. MGR Medical University"
                                  {...register(`qualifications.${idx}.issuingOrganization`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Country</label>
                                <input
                                  type="text"
                                  placeholder="IN"
                                  {...register(`qualifications.${idx}.country`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Completion Date</label>
                                <input
                                  type="date"
                                  {...register(`qualifications.${idx}.completionDate`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Certificate Number</label>
                                <input
                                  type="text"
                                  placeholder="CERT-1002"
                                  {...register(`qualifications.${idx}.certificateNumber`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {qualificationFields.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            No medical qualifications added. Click Add Qualification above.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 5: SPECIALTY & EXPERTISE */}
                  {step === 5 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Specialties</h2>
                          <p className="text-xs text-zinc-400 mt-1">Select your areas of medical practice. Exactly one primary is required.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => appendSpecialty({ specialtyCode: SPECIALTY_OPTIONS[0].code, specialtySystem: "http://snomed.info/sct", specialtyDisplay: SPECIALTY_OPTIONS[0].display, isPrimary: specialtyFields.length === 0 })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Specialty
                        </button>
                      </div>

                      {errors.specialties && (
                        <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-500 font-semibold dark:bg-red-950/20 dark:border-red-900/30">
                          {errors.specialties.message?.toString() || "Please ensure exactly one specialty is marked as primary."}
                        </div>
                      )}

                      <div className="space-y-4">
                        {specialtyFields.map((field, idx) => (
                          <div 
                            key={field.id} 
                            className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20 space-y-4 relative"
                          >
                            <button
                              type="button"
                              onClick={() => removeSpecialty(idx)}
                              className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
                              aria-label="Remove specialty"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>

                            <div className="grid gap-4 sm:grid-cols-3 items-end">
                              <div className="space-y-2 sm:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Medical Specialty</label>
                                <select
                                  {...register(`specialties.${idx}.specialtyCode`)}
                                  onChange={(e) => {
                                    const opt = SPECIALTY_OPTIONS.find(o => o.code === e.target.value);
                                    if (opt) {
                                      setValue(`specialties.${idx}.specialtyDisplay`, opt.display);
                                    }
                                  }}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                  {SPECIALTY_OPTIONS.map(o => (
                                    <option key={o.code} value={o.code}>{o.display}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-2 p-3 bg-white border border-zinc-200 rounded-xl dark:border-zinc-800 dark:bg-zinc-900">
                                <input
                                  type="radio"
                                  id={`primary-spec-${idx}`}
                                  checked={watch(`specialties.${idx}.isPrimary`) === true}
                                  onChange={() => {
                                    // Mark only this specialty as primary
                                    specialtyFields.forEach((_, i) => {
                                      setValue(`specialties.${i}.isPrimary`, i === idx);
                                    });
                                  }}
                                  className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor={`primary-spec-${idx}`} className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300 cursor-pointer">
                                  Primary Specialty
                                </label>
                              </div>

                              {/* Hidden display name field synced automatically */}
                              <input type="hidden" {...register(`specialties.${idx}.specialtyDisplay`)} />
                              <input type="hidden" {...register(`specialties.${idx}.specialtySystem`)} />
                            </div>
                          </div>
                        ))}

                        {specialtyFields.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            No specialties configured. Click Add Specialty above.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 6: PRACTICE & ORGANIZATIONS */}
                  {step === 6 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Practice Affiliations</h2>
                          <p className="text-xs text-zinc-400 mt-1">Assign yourself to seeded clinical organizations and practicing locations.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!lookups) return;
                            appendRole({
                              organizationId: lookups.organizations[0]?.id || "",
                              locations: [lookups.locations[0]?.id || ""],
                              designation: "Consultant",
                              department: "General Medicine",
                              roleCode: "doctor",
                              roleDisplay: "Physician",
                              services: [],
                              availabilities: []
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Organization
                        </button>
                      </div>

                      {errors.roles && (
                        <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-500 font-semibold dark:bg-red-950/20 dark:border-red-900/30">
                          {errors.roles.message?.toString() || "Please correct practice roles details."}
                        </div>
                      )}

                      <div className="space-y-4">
                        {roleFields.map((field, idx) => (
                          <div 
                            key={field.id} 
                            className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20 space-y-4 relative"
                          >
                            <button
                              type="button"
                              onClick={() => removeRole(idx)}
                              className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
                              aria-label="Remove role"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Practice Organization</label>
                                <select
                                  {...register(`roles.${idx}.organizationId`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                  {lookups?.organizations.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Clinical Designation</label>
                                <input
                                  type="text"
                                  placeholder="Senior Physician"
                                  {...register(`roles.${idx}.designation`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Department (Optional)</label>
                                <input
                                  type="text"
                                  placeholder="Endocrinology"
                                  {...register(`roles.${idx}.department`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Location Locations (Select Multi-locations)</label>
                                <div className="max-h-24 overflow-y-auto border border-zinc-200 rounded-xl bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                                  {lookups?.locations.map(loc => {
                                    const currentLocs: string[] = watch(`roles.${idx}.locations`) || [];
                                    const isChecked = currentLocs.includes(loc.id);

                                    return (
                                      <div key={loc.id} className="flex items-center gap-2 py-1 text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setValue(`roles.${idx}.locations`, [...currentLocs, loc.id]);
                                            } else {
                                              setValue(`roles.${idx}.locations`, currentLocs.filter(id => id !== loc.id));
                                            }
                                          }}
                                          className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-zinc-700 dark:text-zinc-300">
                                          {loc.name} ({loc.city}, {loc.state})
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {roleFields.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            No affiliations configured. Click Add Organization above.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 7: LANGUAGES */}
                  {step === 7 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Consultation Languages</h2>
                          <p className="text-xs text-zinc-400 mt-1">Specify language capabilities (at least one language is required).</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => appendLanguage({ languageCode: LANGUAGES_OPTIONS[0].code, languageName: LANGUAGES_OPTIONS[0].name, proficiency: "fluent", preferredForConsultation: languageFields.length === 0 })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Language
                        </button>
                      </div>

                      {errors.languages && (
                        <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-500 font-semibold dark:bg-red-950/20 dark:border-red-900/30">
                          {errors.languages.message?.toString() || "Select at least one language for consults."}
                        </div>
                      )}

                      <div className="space-y-4">
                        {languageFields.map((field, idx) => (
                          <div 
                            key={field.id} 
                            className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20 space-y-4 relative"
                          >
                            <button
                              type="button"
                              onClick={() => removeLanguage(idx)}
                              className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
                              aria-label="Remove language"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>

                            <div className="grid gap-4 sm:grid-cols-3 items-end">
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Language</label>
                                <select
                                  {...register(`languages.${idx}.languageCode`)}
                                  onChange={(e) => {
                                    const opt = LANGUAGES_OPTIONS.find(o => o.code === e.target.value);
                                    if (opt) {
                                      setValue(`languages.${idx}.languageName`, opt.name);
                                    }
                                  }}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                  {LANGUAGES_OPTIONS.map(o => (
                                    <option key={o.code} value={o.code}>{o.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Proficiency</label>
                                <select
                                  {...register(`languages.${idx}.proficiency`)}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                >
                                  <option value="native">Native / Mother Tongue</option>
                                  <option value="fluent">Fluent</option>
                                  <option value="intermediate">Intermediate</option>
                                  <option value="basic">Basic</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-2 p-3 bg-white border border-zinc-200 rounded-xl dark:border-zinc-800 dark:bg-zinc-900">
                                <input
                                  type="checkbox"
                                  id={`preferred-lang-${idx}`}
                                  {...register(`languages.${idx}.preferredForConsultation`)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor={`preferred-lang-${idx}`} className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300 cursor-pointer">
                                  Preferred Consultation
                                </label>
                              </div>

                              <input type="hidden" {...register(`languages.${idx}.languageName`)} />
                            </div>
                          </div>
                        ))}

                        {languageFields.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            No languages added. Click Add Language above.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 8: TELEMEDICINE SERVICES */}
                  {step === 8 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Telemedicine Services</h2>
                        <p className="text-xs text-zinc-400 mt-1">Configure active clinical modes (video, chat, etc.) for each affiliated practice group.</p>
                      </div>

                      <div className="space-y-6">
                        {watchedRoles.map((role: any, rIdx: number) => {
                          const orgName = lookups?.organizations.find(o => o.id === role.organizationId)?.name || `Organization ${rIdx + 1}`;
                          const servicesList = role.services || [];

                          return (
                            <div key={rIdx} className="rounded-3xl border border-zinc-200 bg-zinc-50/20 p-5 space-y-4 dark:border-zinc-800">
                              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50">{orgName}</h3>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentServices = getValues(`roles.${rIdx}.services`) || [];
                                    setValue(`roles.${rIdx}.services`, [
                                      ...currentServices,
                                      { serviceCode: `srv-video`, serviceName: "Video Consultation", consultationMode: "video", duration: 15, fee: 0, currency: "INR", active: true }
                                    ]);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Service
                                </button>
                              </div>

                              <div className="space-y-3">
                                {servicesList.map((srv: any, sIdx: number) => (
                                  <div key={sIdx} className="grid gap-4 sm:grid-cols-4 items-end bg-white border border-zinc-200 p-4 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setValue(`roles.${rIdx}.services`, servicesList.filter((_: any, i: number) => i !== sIdx));
                                      }}
                                      className="absolute top-2 right-2 text-zinc-400 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="space-y-2 sm:col-span-2">
                                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Service Mode</label>
                                      <select
                                        {...register(`roles.${rIdx}.services.${sIdx}.consultationMode`)}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setValue(`roles.${rIdx}.services.${sIdx}.serviceCode`, `srv-${val}`);
                                          setValue(`roles.${rIdx}.services.${sIdx}.serviceName`, `${val.charAt(0).toUpperCase() + val.slice(1)} Consultation`);
                                        }}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      >
                                        <option value="video">Video Consultation</option>
                                        <option value="audio">Audio Consultation</option>
                                        <option value="chat">Text Chat Consultation</option>
                                        <option value="offline">In-Clinic Consultation</option>
                                      </select>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Duration (Minutes)</label>
                                      <input
                                        type="number"
                                        {...register(`roles.${rIdx}.services.${sIdx}.duration`, { valueAsNumber: true })}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      />
                                    </div>

                                    {/* Sync fields */}
                                    <input type="hidden" {...register(`roles.${rIdx}.services.${sIdx}.serviceCode`)} />
                                    <input type="hidden" {...register(`roles.${rIdx}.services.${sIdx}.serviceName`)} />
                                    <input type="hidden" {...register(`roles.${rIdx}.services.${sIdx}.currency`)} />
                                    <input type="hidden" {...register(`roles.${rIdx}.services.${sIdx}.active`)} />
                                  </div>
                                ))}

                                {servicesList.length === 0 && (
                                  <div className="text-center py-6 text-xs text-zinc-400 italic">
                                    No services configured. Click Add Service above.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {watchedRoles.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            Configure practicing organizations in Step 6 first.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 9: PRICING */}
                  {step === 9 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Consultation Pricing</h2>
                        <p className="text-xs text-zinc-400 mt-1">Set non-negative clinical consultation fees and ISO currency codes.</p>
                      </div>

                      <div className="space-y-6">
                        {watchedRoles.map((role: any, rIdx: number) => {
                          const orgName = lookups?.organizations.find(o => o.id === role.organizationId)?.name || `Organization ${rIdx + 1}`;
                          const servicesList = role.services || [];

                          return (
                            <div key={rIdx} className="rounded-3xl border border-zinc-200 bg-zinc-50/20 p-5 space-y-4 dark:border-zinc-800">
                              <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 border-b border-zinc-200 pb-2 dark:border-zinc-800">{orgName}</h3>
                              
                              <div className="space-y-3">
                                {servicesList.map((srv: any, sIdx: number) => (
                                  <div key={sIdx} className="grid gap-4 sm:grid-cols-3 items-end bg-white border border-zinc-200 p-4 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800">
                                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                      {srv.serviceName} ({srv.duration} mins)
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Consultation Fee</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="500.00"
                                        {...register(`roles.${rIdx}.services.${sIdx}.fee`, { valueAsNumber: true })}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">ISO Currency</label>
                                      <select
                                        {...register(`roles.${rIdx}.services.${sIdx}.currency`)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="EUR">EUR (€)</option>
                                      </select>
                                    </div>
                                  </div>
                                ))}

                                {servicesList.length === 0 && (
                                  <div className="text-center py-4 text-xs text-zinc-400 italic">
                                    No services configured. Go back to Step 8.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {watchedRoles.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            Configure practicing organizations in Step 6 first.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 10: AVAILABILITY */}
                  {step === 10 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Availability Scheduling</h2>
                        <p className="text-xs text-zinc-400 mt-1">Configure weekly calendar consultation hours and timezone parameters.</p>
                      </div>

                      <div className="space-y-6">
                        {watchedRoles.map((role: any, rIdx: number) => {
                          const orgName = lookups?.organizations.find(o => o.id === role.organizationId)?.name || `Organization ${rIdx + 1}`;
                          const availList = role.availabilities || [];

                          return (
                            <div key={rIdx} className="rounded-3xl border border-zinc-200 bg-zinc-50/20 p-5 space-y-4 dark:border-zinc-800">
                              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50">{orgName}</h3>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentAvails = getValues(`roles.${rIdx}.availabilities`) || [];
                                    setValue(`roles.${rIdx}.availabilities`, [
                                      ...currentAvails,
                                      { dayOfWeek: "MON", availableFrom: "09:00", availableTo: "17:00", timezone: "Asia/Kolkata", appointmentDurationMinutes: 15, bufferMinutes: 5 }
                                    ]);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Slot
                                </button>
                              </div>

                              <div className="space-y-3">
                                {availList.map((avail: any, aIdx: number) => (
                                  <div key={aIdx} className="grid gap-4 sm:grid-cols-3 items-end bg-white border border-zinc-200 p-4 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setValue(`roles.${rIdx}.availabilities`, availList.filter((_: any, i: number) => i !== aIdx));
                                      }}
                                      className="absolute top-2 right-2 text-zinc-400 hover:text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Day</label>
                                      <select
                                        {...register(`roles.${rIdx}.availabilities.${aIdx}.dayOfWeek`)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      >
                                        <option value="MON">Monday</option>
                                        <option value="TUE">Tuesday</option>
                                        <option value="WED">Wednesday</option>
                                        <option value="THU">Thursday</option>
                                        <option value="FRI">Friday</option>
                                        <option value="SAT">Saturday</option>
                                        <option value="SUN">Sunday</option>
                                      </select>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">From (HH:MM)</label>
                                      <input
                                        type="text"
                                        placeholder="09:00"
                                        {...register(`roles.${rIdx}.availabilities.${aIdx}.availableFrom`)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">To (HH:MM)</label>
                                      <input
                                        type="text"
                                        placeholder="17:00"
                                        {...register(`roles.${rIdx}.availabilities.${aIdx}.availableTo`)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      />
                                    </div>

                                    <div className="space-y-2 sm:col-span-3">
                                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">IANATimezone</label>
                                      <input
                                        type="text"
                                        placeholder="Asia/Kolkata"
                                        {...register(`roles.${rIdx}.availabilities.${aIdx}.timezone`)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                                      />
                                    </div>

                                    <input type="hidden" {...register(`roles.${rIdx}.availabilities.${aIdx}.appointmentDurationMinutes`)} />
                                    <input type="hidden" {...register(`roles.${rIdx}.availabilities.${aIdx}.bufferMinutes`)} />
                                  </div>
                                ))}

                                {availList.length === 0 && (
                                  <div className="text-center py-4 text-xs text-zinc-400 italic">
                                    No availability slots configured. Click Add Slot.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {watchedRoles.length === 0 && (
                          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 dark:border-zinc-800">
                            Configure practicing organizations in Step 6 first.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 11: PROFESSIONAL PROFILE */}
                  {step === 11 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Professional Profile</h2>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="yearsOfExperience" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Years of Experience</label>
                          <input
                            id="yearsOfExperience"
                            type="number"
                            aria-invalid={!!errors.yearsOfExperience}
                            {...register("yearsOfExperience", { valueAsNumber: true })}
                            className="w-48 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.yearsOfExperience && <p className="text-xs text-red-500 font-semibold">{errors.yearsOfExperience.message?.toString()}</p>}
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="professionalBio" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Professional Bio</label>
                          <textarea
                            id="professionalBio"
                            rows={6}
                            aria-invalid={!!errors.professionalBio}
                            {...register("professionalBio")}
                            placeholder="Introduce your medical background, board certifications, and areas of expertise to patients..."
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
                          />
                          {errors.professionalBio && <p className="text-xs text-red-500 font-semibold">{errors.professionalBio.message?.toString()}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 12: VERIFICATION DOCUMENTS */}
                  {step === 12 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Verification Documents</h2>
                        <p className="text-xs text-zinc-400 mt-1">Upload files verifying your practitioner credentials. PDF or image sizes up to 5MB.</p>
                      </div>

                      {errors.documents && (
                        <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-500 font-semibold dark:bg-red-950/20 dark:border-red-900/30">
                          {errors.documents.message?.toString() || "Please upload required credentials."}
                        </div>
                      )}

                      <div className="grid gap-6 sm:grid-cols-3">
                        {/* 1. License Document */}
                        <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Required File</span>
                            <h3 className="font-bold text-sm">Medical License</h3>
                            <p className="text-xs text-zinc-400">Upload your current state medical commission practicing certificate.</p>
                          </div>
                          
                          <div className="pt-2">
                            {watch("documents")?.some((d: any) => d.docType === "license") ? (
                              <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl dark:bg-emerald-950/10 dark:border-emerald-900/30">
                                <span className="font-semibold text-emerald-800 dark:text-emerald-300">File uploaded</span>
                                <Check className="h-4 w-4 text-emerald-600" />
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-1 border-2 border-dashed border-zinc-200 rounded-xl p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                                <Upload className="h-5 w-5 text-zinc-400" />
                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                                  {uploading === "license" ? "Uploading..." : "Upload PDF / Image"}
                                </span>
                                <input
                                  type="file"
                                  accept="application/pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, "license")}
                                  disabled={uploading !== null}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* 2. Qualification Document */}
                        <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Required File</span>
                            <h3 className="font-bold text-sm">Degree Certificate</h3>
                            <p className="text-xs text-zinc-400">Upload your MD, MBBS, or Board diploma certificate copy.</p>
                          </div>
                          
                          <div className="pt-2">
                            {watch("documents")?.some((d: any) => d.docType === "qualification") ? (
                              <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl dark:bg-emerald-950/10 dark:border-emerald-900/30">
                                <span className="font-semibold text-emerald-800 dark:text-emerald-300">File uploaded</span>
                                <Check className="h-4 w-4 text-emerald-600" />
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-1 border-2 border-dashed border-zinc-200 rounded-xl p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                                <Upload className="h-5 w-5 text-zinc-400" />
                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                                  {uploading === "qualification" ? "Uploading..." : "Upload PDF / Image"}
                                </span>
                                <input
                                  type="file"
                                  accept="application/pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, "qualification")}
                                  disabled={uploading !== null}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* 3. Identity Document */}
                        <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">Required File</span>
                            <h3 className="font-bold text-sm">Identity Proof</h3>
                            <p className="text-xs text-zinc-400">Upload passport copy, national ID card, or Aadhaar identity proof.</p>
                          </div>
                          
                          <div className="pt-2">
                            {watch("documents")?.some((d: any) => d.docType === "identity") ? (
                              <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl dark:bg-emerald-950/10 dark:border-emerald-900/30">
                                <span className="font-semibold text-emerald-800 dark:text-emerald-300">File uploaded</span>
                                <Check className="h-4 w-4 text-emerald-600" />
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-1 border-2 border-dashed border-zinc-200 rounded-xl p-4 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                                <Upload className="h-5 w-5 text-zinc-400" />
                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                                  {uploading === "identity" ? "Uploading..." : "Upload PDF / Image"}
                                </span>
                                <input
                                  type="file"
                                  accept="application/pdf,image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, "identity")}
                                  disabled={uploading !== null}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                                   {/* STEP 13: CONSENT & REVIEW */}
                  {step === 13 && (
                    <div className="space-y-8 animate-in fade-in duration-350">
                      
                      {/* Submission Progress Overlay */}
                      {submitStage !== "review" && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 text-center space-y-6">
                            {submitStage === "confirm" && (
                              <div className="space-y-6">
                                <h3 className="text-xl font-black text-zinc-955 dark:text-white">Submit Doctor Profile for Verification?</h3>
                                <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 text-left bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl">
                                  <p className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>Your profile will enter verification review.</span>
                                  </p>
                                  <p className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>Information can no longer be freely changed after submission.</span>
                                  </p>
                                  <p className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>An administrator may request changes if credentials cannot be verified.</span>
                                  </p>
                                </div>
                                <div className="flex gap-4">
                                  <button
                                    type="button"
                                    onClick={() => setSubmitStage("review")}
                                    className="w-1/2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={startSubmissionProcess}
                                    className="w-1/2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10"
                                  >
                                    Confirm Submission
                                  </button>
                                </div>
                              </div>
                            )}

                            {submitStage === "submitting" && (
                              <div className="space-y-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto dark:border-emerald-500"></div>
                                <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Processing Profile</h3>
                                <div className="space-y-2 text-xs font-semibold text-zinc-500 text-left bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl">
                                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                    <span>Submitting draft...</span>
                                    {progressIndex >= 0 && <Check className="h-4 w-4 text-emerald-600" />}
                                  </div>
                                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                    <span>Validating credentials...</span>
                                    {progressIndex >= 1 && <Check className="h-4 w-4 text-emerald-600" />}
                                  </div>
                                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                    <span>Creating provider profile...</span>
                                    {progressIndex >= 2 && <Check className="h-4 w-4 text-emerald-600" />}
                                  </div>
                                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                    <span>Preparing interoperability resources...</span>
                                    {progressIndex >= 3 && <Check className="h-4 w-4 text-emerald-600" />}
                                  </div>
                                  <div className="flex items-center justify-between py-1">
                                    <span>Complete</span>
                                    {progressIndex >= 4 && <Check className="h-4 w-4 text-emerald-600" />}
                                  </div>
                                </div>
                              </div>
                            )}

                            {submitStage === "complete" && (
                              <div className="space-y-6">
                                <div className="rounded-full bg-emerald-50 p-3 w-16 h-16 flex items-center justify-center mx-auto dark:bg-emerald-950/30">
                                  <Check className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-black text-zinc-950 dark:text-white">Profile Submitted Successfully</h3>
                                <p className="text-sm text-zinc-500">Your profile has been submitted for verification.</p>
                                
                                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                                  Status: UNDER_REVIEW
                                </div>

                                <button
                                  type="button"
                                  onClick={() => router.push("/onboarding/status")}
                                  className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Review Sections */}
                      <div className="space-y-6 text-left">
                        <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Review Profile Details</h2>
                        <p className="text-xs text-zinc-400 mt-1">Please review all registered credentials before final validation.</p>

                        {/* Validation summary Alert */}
                        {blockingIssues.length > 0 && (
                          <div className="rounded-2xl bg-red-50 p-5 border border-red-200 text-sm text-red-800 space-y-3 dark:bg-red-950/20 dark:border-red-900/30">
                            <div className="flex items-center gap-2 font-bold text-red-950 dark:text-red-300">
                              <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />
                              <span>{blockingIssues.length} items need your attention</span>
                            </div>
                            <ul className="list-disc pl-5 text-xs text-red-700 dark:text-red-400 space-y-1">
                              {blockingIssues.map((err, idx) => (
                                <li 
                                  key={idx} 
                                  onClick={() => {
                                    const nav = getErrorNavigation(err.field);
                                    setStep(nav.step);
                                    setTimeout(() => {
                                      const el = document.getElementById(nav.field) || document.querySelector(`[name="${nav.field}"]`);
                                      if (el) {
                                        el.scrollIntoView({ behavior: "smooth" });
                                        (el as HTMLElement).focus();
                                      }
                                    }, 150);
                                  }}
                                  className="cursor-pointer hover:underline text-left"
                                >
                                  {err.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid gap-6 sm:grid-cols-2">
                          {/* 1. Personal Information */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">1. Personal Information</h4>
                              <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              <div><span className="font-semibold text-zinc-500">Name:</span> {watch("title")} {watch("firstName")} {watch("middleName")} {watch("lastName")}</div>
                              <div><span className="font-semibold text-zinc-500">Display Name:</span> {watch("displayName")}</div>
                              <div><span className="font-semibold text-zinc-500">Gender:</span> {watch("gender")}</div>
                              <div><span className="font-semibold text-zinc-500">Birth Date:</span> {watch("birthDate")}</div>
                            </div>
                          </div>

                          {/* 2. Contact */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">2. Contact</h4>
                              <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              <div><span className="font-semibold text-zinc-500">Email:</span> {watch("email")}</div>
                              <div><span className="font-semibold text-zinc-500">Phone:</span> {watch("phone")}</div>
                              <div><span className="font-semibold text-zinc-500">Alternate Phone:</span> {watch("alternatePhone") || "None"}</div>
                              <div><span className="font-semibold text-zinc-500">Preferred Method:</span> {watch("preferredContactMethod")}</div>
                            </div>
                          </div>

                          {/* 3. Registration */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">3. Registration</h4>
                              <button type="button" onClick={() => setStep(3)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("identifiers") || []).length === 0 && <div className="text-zinc-400 italic">No registrations registered.</div>}
                              {(watch("identifiers") || []).map((i: any, idx: number) => (
                                <div key={idx} className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                                  <span className="font-semibold">{i.type || "License"}:</span> {i.value} ({i.issuer})
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 4. Qualifications */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">4. Qualifications</h4>
                              <button type="button" onClick={() => setStep(4)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("qualifications") || []).length === 0 && <div className="text-zinc-400 italic">No qualifications added.</div>}
                              {(watch("qualifications") || []).map((q: any, idx: number) => (
                                <div key={idx} className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                                  <span className="font-semibold">{q.degreeName} ({q.qualificationType}):</span> {q.institution} ({q.completionDate})
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 5. Specialty */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">5. Specialty</h4>
                              <button type="button" onClick={() => setStep(5)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("specialties") || []).length === 0 && <div className="text-zinc-400 italic">No specialties chosen.</div>}
                              {(watch("specialties") || []).map((s: any, idx: number) => (
                                <div key={idx}>
                                  <span className="font-semibold">{s.specialtyDisplay}</span> {s.isPrimary && <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold dark:bg-emerald-950 dark:text-emerald-300 ml-1.5 font-sans">Primary</span>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 6. Organizations */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">6. Organizations</h4>
                              <button type="button" onClick={() => setStep(6)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("roles") || []).length === 0 && <div className="text-zinc-400 italic">No organization roles defined.</div>}
                              {(watch("roles") || []).map((r: any, idx: number) => {
                                const orgName = lookups?.organizations.find(o => o.id === r.organizationId)?.name || r.organizationId;
                                return (
                                  <div key={idx} className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                                    <span className="font-semibold">{orgName}:</span> {r.designation} ({r.department || "General"})
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 7. Locations */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">7. Locations</h4>
                              <button type="button" onClick={() => setStep(6)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("roles") || []).length === 0 && <div className="text-zinc-400 italic">No locations configured.</div>}
                              {(watch("roles") || []).map((r: any, idx: number) => {
                                const orgName = lookups?.organizations.find(o => o.id === r.organizationId)?.name || r.organizationId;
                                const locNames = (r.locations || []).map((lid: string) => {
                                  return lookups?.locations.find(l => l.id === lid)?.name || lid;
                                }).join(", ");
                                return (
                                  <div key={idx} className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                                    <span className="font-semibold">{orgName}:</span> {locNames || "None"}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 8. Languages */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">8. Languages</h4>
                              <button type="button" onClick={() => setStep(7)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("languages") || []).length === 0 && <div className="text-zinc-400 italic">No languages added.</div>}
                              {(watch("languages") || []).map((l: any, idx: number) => (
                                <div key={idx}>
                                  <span className="font-semibold">{l.languageName || l.languageCode}:</span> {l.proficiency} {l.preferredForConsultation && <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 rounded dark:bg-emerald-950 dark:text-emerald-300 font-bold ml-1 font-sans">Preferred</span>}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 9. Services */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">9. Services</h4>
                              <button type="button" onClick={() => setStep(8)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("roles") || []).flatMap((r: any) => r.services || []).length === 0 && <div className="text-zinc-400 italic">No services registered.</div>}
                              {(watch("roles") || []).map((r: any, idx: number) => {
                                const orgName = lookups?.organizations.find(o => o.id === r.organizationId)?.name || r.organizationId;
                                const srvDetails = (r.services || []).map((s: any) => `${s.serviceName || s.serviceCode} (${s.consultationMode})`).join(", ");
                                return (
                                  <div key={idx} className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                                    <span className="font-semibold">{orgName}:</span> {srvDetails || "None"}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 10. Pricing */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">10. Pricing</h4>
                              <button type="button" onClick={() => setStep(9)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("roles") || []).flatMap((r: any) => r.services || []).length === 0 && <div className="text-zinc-400 italic">No pricing settings.</div>}
                              {(watch("roles") || []).map((r: any, idx: number) => {
                                const orgName = lookups?.organizations.find(o => o.id === r.organizationId)?.name || r.organizationId;
                                const pricingDetails = (r.services || []).map((s: any) => `${s.serviceName || s.serviceCode}: ${s.currency} ${s.fee}`).join(", ");
                                return (
                                  <div key={idx} className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                                    <span className="font-semibold">{orgName}:</span> {pricingDetails || "None"}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 11. Availability */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">11. Availability</h4>
                              <button type="button" onClick={() => setStep(10)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              {(watch("roles") || []).flatMap((r: any) => r.availabilities || []).length === 0 && <div className="text-zinc-400 italic">No availabilities saved.</div>}
                              {(watch("roles") || []).map((r: any, idx: number) => {
                                const orgName = lookups?.organizations.find(o => o.id === r.organizationId)?.name || r.organizationId;
                                const avails = (r.availabilities || []).map((a: any) => `${a.dayOfWeek}: ${a.availableFrom}-${a.availableTo}`).join(", ");
                                return (
                                  <div key={idx} className="border-b border-zinc-100 pb-1 last:border-0 dark:border-zinc-800">
                                    <span className="font-semibold">{orgName}:</span> {avails || "None"}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 12. Professional Profile */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">12. Professional Profile</h4>
                              <button type="button" onClick={() => setStep(11)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              <div><span className="font-semibold text-zinc-500">Years of Experience:</span> {watch("yearsOfExperience")} years</div>
                              <div><span className="font-semibold text-zinc-500">Bio:</span> {watch("professionalBio") || "None"}</div>
                            </div>
                          </div>

                          {/* 13. Documents */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative sm:col-span-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">13. Documents</h4>
                              <button type="button" onClick={() => setStep(12)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs grid gap-3 sm:grid-cols-3">
                              {["license", "qualification", "identity"].map((docType) => {
                                const doc = watch("documents")?.find((d: any) => d.docType === docType);
                                return (
                                  <div key={docType} className="bg-zinc-50 p-3 rounded-xl dark:bg-zinc-950">
                                    <span className="block font-bold text-[10px] uppercase tracking-wider text-zinc-450 dark:text-zinc-500">{docType}</span>
                                    {doc ? (
                                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">{doc.fileName || "File attached"}</span>
                                    ) : (
                                      <span className="text-red-500 font-semibold italic">Missing file</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 14. Consent */}
                          <div className="rounded-2xl border border-zinc-200 p-5 bg-white space-y-3 dark:border-zinc-800 dark:bg-zinc-900 relative sm:col-span-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">14. Consent</h4>
                              <button type="button" onClick={() => setStep(13)} className="text-xs font-bold text-emerald-600 hover:underline">Edit</button>
                            </div>
                            <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                              <div><span className="font-semibold text-zinc-500">Platform Terms:</span> {watch("consent.platformTermsAccepted") ? "Accepted" : "Not accepted"}</div>
                              <div><span className="font-semibold text-zinc-500">Privacy Policy:</span> {watch("consent.privacyPolicyAccepted") ? "Accepted" : "Not accepted"}</div>
                              <div><span className="font-semibold text-zinc-500">Telemedicine Terms:</span> {watch("consent.telemedicineTermsAccepted") ? "Accepted" : "Not accepted"}</div>
                              <div><span className="font-semibold text-zinc-500">AI Assistant:</span> {watch("consent.aiAssistanceAcknowledgement") ? "Accepted" : "Not accepted"}</div>
                              <div><span className="font-semibold text-zinc-500">Clinical Responsibility:</span> {watch("consent.clinicalResponsibilityAcknowledgement") ? "Accepted" : "Not accepted"}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consents Checkboxes */}
                      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-left">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Mandatory Platform Agreements</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="consent.platformTermsAccepted"
                              aria-invalid={!!(errors?.consent as any)?.platformTermsAccepted}
                              {...register("consent.platformTermsAccepted")}
                              className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="consent.platformTermsAccepted" className="text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                              I accept the DrGodly Platform Terms of Service.
                            </label>
                          </div>
                          {(errors?.consent as any)?.platformTermsAccepted && <p className="text-xs text-red-500 font-semibold">{(errors.consent as any).platformTermsAccepted.message?.toString()}</p>}

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="consent.privacyPolicyAccepted"
                              aria-invalid={!!(errors?.consent as any)?.privacyPolicyAccepted}
                              {...register("consent.privacyPolicyAccepted")}
                              className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="consent.privacyPolicyAccepted" className="text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                              I accept the DrGodly Privacy Policy and data storage regulations.
                            </label>
                          </div>
                          {(errors?.consent as any)?.privacyPolicyAccepted && <p className="text-xs text-red-500 font-semibold">{(errors.consent as any).privacyPolicyAccepted.message?.toString()}</p>}

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="consent.telemedicineTermsAccepted"
                              aria-invalid={!!(errors?.consent as any)?.telemedicineTermsAccepted}
                              {...register("consent.telemedicineTermsAccepted")}
                              className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="consent.telemedicineTermsAccepted" className="text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                              I accept the Telemedicine Consultation Agreement and liability limits.
                            </label>
                          </div>
                          {(errors?.consent as any)?.telemedicineTermsAccepted && <p className="text-xs text-red-500 font-semibold">{(errors.consent as any).telemedicineTermsAccepted.message?.toString()}</p>}

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="consent.aiAssistanceAcknowledgement"
                              aria-invalid={!!(errors?.consent as any)?.aiAssistanceAcknowledgement}
                              {...register("consent.aiAssistanceAcknowledgement")}
                              className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="consent.aiAssistanceAcknowledgement" className="text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                              I acknowledge that DrGodly uses clinical AI assistant copilots to draft chart summaries and I verify and approve all medical decisions.
                            </label>
                          </div>
                          {(errors?.consent as any)?.aiAssistanceAcknowledgement && <p className="text-xs text-red-500 font-semibold">{(errors.consent as any).aiAssistanceAcknowledgement.message?.toString()}</p>}

                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="consent.clinicalResponsibilityAcknowledgement"
                              aria-invalid={!!(errors?.consent as any)?.clinicalResponsibilityAcknowledgement}
                              {...register("consent.clinicalResponsibilityAcknowledgement")}
                              className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="consent.clinicalResponsibilityAcknowledgement" className="text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                              I accept sole clinical responsibility for patient diagnoses and prescription authorizations.
                            </label>
                          </div>
                          {(errors?.consent as any)?.clinicalResponsibilityAcknowledgement && <p className="text-xs text-red-500 font-semibold">{(errors.consent as any).clinicalResponsibilityAcknowledgement.message?.toString()}</p>}
                        </div>
                      </div>

                      {/* FHIR Diagnostics tab (admin-only) */}
                      {userRole === "admin" && fhirPreview && (
                        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/20 text-left">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">FHIR R4 Diagnostic Preview (Admin Only)</h4>
                            <button 
                              type="button" 
                              onClick={() => setShowFhirPreview(!showFhirPreview)}
                              className="text-xs font-semibold underline text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                              {showFhirPreview ? "Hide Preview" : "Show Preview"}
                            </button>
                          </div>
                          
                          {showFhirPreview && (
                            <div className="space-y-4">
                              <p className="text-[10px] text-zinc-400">Validate live serialization models mapping practitioner fields to HL7 resources.</p>
                              <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Practitioner generated</span>
                                <pre className="font-mono text-[10px] overflow-x-auto max-h-48 bg-zinc-900 text-zinc-100 p-3 rounded-xl">
                                  {JSON.stringify(
                                    fhirPreview.entry?.find((e: any) => e.resource.resourceType === "Practitioner")?.resource || { error: "Not mapped" },
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                              <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">PractitionerRole generated</span>
                                <pre className="font-mono text-[10px] overflow-x-auto max-h-48 bg-zinc-900 text-zinc-100 p-3 rounded-xl">
                                  {JSON.stringify(
                                    fhirPreview.entry?.find((e: any) => e.resource.resourceType === "PractitionerRole")?.resource || { error: "Not mapped" },
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                              <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Organization generated</span>
                                <pre className="font-mono text-[10px] overflow-x-auto max-h-48 bg-zinc-900 text-zinc-100 p-3 rounded-xl">
                                  {JSON.stringify(
                                    fhirPreview.entry?.find((e: any) => e.resource.resourceType === "Organization")?.resource || { error: "Not mapped" },
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                              <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">Location generated</span>
                                <pre className="font-mono text-[10px] overflow-x-auto max-h-48 bg-zinc-900 text-zinc-100 p-3 rounded-xl">
                                  {JSON.stringify(
                                    fhirPreview.entry?.find((e: any) => e.resource.resourceType === "Location")?.resource || { error: "Not mapped" },
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                              <div className="space-y-2">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">HealthcareService generated</span>
                                <pre className="font-mono text-[10px] overflow-x-auto max-h-48 bg-zinc-900 text-zinc-100 p-3 rounded-xl">
                                  {JSON.stringify(
                                    fhirPreview.entry?.find((e: any) => e.resource.resourceType === "HealthcareService")?.resource || { error: "Not mapped" },
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submit Errors Alert Box */}
                      {submitError && (
                        <div className="rounded-2xl bg-red-50 p-5 border border-red-200 text-sm text-red-800 space-y-3 dark:bg-red-950/20 dark:border-red-900/30">
                          <div className="flex items-center gap-2 font-bold text-red-950 dark:text-red-300">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            {submitError}
                          </div>
                          {submitErrorsList.length > 0 && (
                            <ul className="list-disc pl-5 text-xs text-red-700 dark:text-red-400 space-y-1">
                              {submitErrorsList.map((err, i) => (
                                <li key={i} className="text-left">
                                  <span className="font-bold uppercase tracking-wider">{err.field}</span>: {err.message}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-transform active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {step < 13 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-zinc-800 transition-transform active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10 active:scale-[0.99] disabled:opacity-50"
                >
                  {saving ? "Submitting profile..." : "Submit Application"}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>

          </form>

        </div>
      </div>
    </FormProvider>
  );
}
