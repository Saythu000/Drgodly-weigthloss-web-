"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, CheckCircle, XCircle, Clock, FileText, Globe, 
  MapPin, Shield, BookOpen, Calendar, HelpCircle, Eye, AlertCircle,
  Plus, Trash2, ShieldAlert, FileClock, ClipboardCheck, Ban
} from "lucide-react";

interface PractitionerApplication {
  id: string;
  userId: string;
  title: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
  languages: Array<{ languageCode: string; languageName: string; proficiency: string; preferredForConsultation: boolean }>;
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  identifiers: Array<{ id: string; system: string; value: string; type: string; issuer: string | null }>;
  qualifications: Array<{ id: string; qualificationType: string; degreeName: string; specialization: string | null; institution: string; country: string; completions: string | null; completionDate: string; certificateNumber: string }>;
  specialties: Array<{ id: string; specialtyCode: string; specialtySystem: string; specialtyDisplay: string; isPrimary: boolean }>;
  consents: Array<{ id: string; consentType: string; accepted: boolean; acceptedAt: string }>;
  roles: Array<{
    id: string;
    designation: string;
    department: string | null;
    organization: { name: string };
    locations: Array<{ location: { name: string; city: string; state: string } }>;
    services: Array<{ serviceCode: string; serviceName: string; consultationMode: string; duration: number; fee: number; currency: string }>;
    availabilities: Array<{ dayOfWeek: string; availableFrom: string; availableTo: string; timezone: string }>;
  }>;
  documents: Array<{ id: string; title: string; url: string; docType: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null; verificationStatus: string; verifiedBy: string | null; verifiedAt: string | null; rejectionReason: string | null }>;
}

export default function DoctorOnboardingReview() {
  const [applications, setApplications] = useState<PractitionerApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<PractitionerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [filterOrganization, setFilterOrganization] = useState<string>("all");
  const [filterAuthority, setFilterAuthority] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");

  // Action Panel State
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Correction items list
  const [correctionItems, setCorrectionItems] = useState<Array<{ field: string; reason: string }>>([
    { field: "registrationNumber", reason: "" }
  ]);

  // FHIR Diagnostics Preview State
  const [fhirPreview, setFhirPreview] = useState<any>(null);
  const [showFhirPreview, setShowFhirPreview] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/onboarding");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        if (selectedApp) {
          const updated = data.find((a: any) => a.id === selectedApp.id);
          setSelectedApp(updated || null);
        }
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Fetch FHIR preview when selected practitioner changes
  useEffect(() => {
    if (selectedApp) {
      setFhirPreview(null);
      setShowFhirPreview(false);
      fetch(`/api/admin/onboarding/${selectedApp.id}/fhir-preview`)
        .then(res => {
          if (res.ok) return res.json();
          return null;
        })
        .then(data => setFhirPreview(data))
        .catch(err => console.error("Error fetching admin fhir preview:", err));
    }
  }, [selectedApp]);

  const handleDecision = async (status: "approved" | "rejected" | "changes_requested" | "suspended", customReason?: string) => {
    if (!selectedApp) return;

    setActionLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/admin/onboarding/${selectedApp.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectionReason: customReason,
        }),
      });

      if (res.ok) {
        setRejectionReason("");
        setShowRejectForm(false);
        setShowChangesForm(false);
        setCorrectionItems([{ field: "registrationNumber", reason: "" }]);
        await fetchApplications();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Failed to submit decision.");
      }
    } catch (err) {
      setErrorMsg("An error occurred during verification.");
    } finally {
      setActionLoading(false);
    }
  };

  // Compile Dynamic Filters dropdown options
  const specialtiesList = Array.from(new Set(applications.flatMap(app => (app.specialties || []).map(s => s.specialtyDisplay)).filter((val): val is string => !!val)));
  const organizationsList = Array.from(new Set(applications.flatMap(app => (app.roles || []).map(r => r.organization?.name)).filter((val): val is string => !!val)));
  const authoritiesList = Array.from(new Set(applications.flatMap(app => (app.identifiers || []).map(i => i.issuer)).filter((val): val is string => !!val)));

  // Filtered Applications List
  const filteredApps = applications.filter(app => {
    if (filterStatus !== "all" && app.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterSpecialty !== "all" && !(app.specialties || []).some(s => s.specialtyDisplay === filterSpecialty)) return false;
    if (filterOrganization !== "all" && !(app.roles || []).some(r => r.organization?.name === filterOrganization)) return false;
    if (filterAuthority !== "all" && !(app.identifiers || []).some(i => i.issuer === filterAuthority)) return false;
    if (filterDate) {
      const appDateStr = app.submittedAt ? new Date(app.submittedAt).toISOString().split("T")[0] : new Date(app.updatedAt).toISOString().split("T")[0];
      if (appDateStr !== filterDate) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const norm = (status || "").toLowerCase();
    switch (norm) {
      case "verified":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Verified
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-950/30 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      case "changes_requested":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse">
            <ShieldAlert className="h-3.5 w-3.5" />
            Changes Requested
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-100 dark:bg-zinc-700 dark:text-zinc-300">
            <Ban className="h-3.5 w-3.5" />
            Suspended
          </span>
        );
      case "submitted":
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            <FileText className="h-3.5 w-3.5" />
            Draft
          </span>
        );
    }
  };

  const addCorrectionRow = () => {
    setCorrectionItems([...correctionItems, { field: "registrationNumber", reason: "" }]);
  };

  const removeCorrectionRow = (idx: number) => {
    setCorrectionItems(correctionItems.filter((_, i) => i !== idx));
  };

  const updateCorrectionRow = (idx: number, key: "field" | "reason", val: string) => {
    const updated = [...correctionItems];
    updated[idx][key] = val;
    setCorrectionItems(updated);
  };

  const submitCorrectionRequests = () => {
    const emptyReason = correctionItems.some(i => !i.reason.trim());
    if (emptyReason) {
      setErrorMsg("Please specify correction reasons for all selected fields.");
      return;
    }
    handleDecision("changes_requested", JSON.stringify(correctionItems));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] text-left">
      {/* Master List Panel */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col min-h-[500px]">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
              <Users className="h-5 w-5 text-zinc-500" />
              Onboarding Applications
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Review credentials, audit logs, and assign verified permissions.</p>
          </div>
          <button 
            type="button" 
            onClick={fetchApplications} 
            className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 hover:bg-zinc-50 font-bold dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {/* Dynamic Filters Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 bg-zinc-50 p-4 rounded-2xl dark:bg-zinc-950/60">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-zinc-250 rounded-xl px-2 py-1.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Specialty</label>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full bg-white border border-zinc-250 rounded-xl px-2 py-1.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="all">All Specialties</option>
              {specialtiesList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organization</label>
            <select
              value={filterOrganization}
              onChange={(e) => setFilterOrganization(e.target.value)}
              className="w-full bg-white border border-zinc-250 rounded-xl px-2 py-1.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="all">All Organizations</option>
              {organizationsList.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Authority</label>
            <select
              value={filterAuthority}
              onChange={(e) => setFilterAuthority(e.target.value)}
              className="w-full bg-white border border-zinc-250 rounded-xl px-2 py-1.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
            >
              <option value="all">All Authorities</option>
              {authoritiesList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sub Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-white border border-zinc-250 rounded-xl px-2 py-1.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
            />
          </div>

          <div className="flex items-end justify-end pb-1.5">
            <button
              type="button"
              onClick={() => {
                setFilterStatus("all");
                setFilterSpecialty("all");
                setFilterOrganization("all");
                setFilterAuthority("all");
                setFilterDate("");
              }}
              className="text-[10px] font-bold text-red-650 hover:underline dark:text-red-400"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Scrollable list items */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mx-auto"></div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-zinc-400">
            <HelpCircle className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm font-semibold">No matching profiles found.</p>
            <p className="text-xs mt-1">Adjust filters or check back later.</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-2">
            {filteredApps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  setSelectedApp(app);
                  setShowRejectForm(false);
                  setShowChangesForm(false);
                  setRejectionReason("");
                  setCorrectionItems([{ field: "registrationNumber", reason: "" }]);
                  setErrorMsg("");
                }}
                className={`w-full flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all ${
                  selectedApp?.id === app.id
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50"
                    : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Dr. {app.firstName} {app.lastName}
                    </h3>
                    <p className="text-xs text-zinc-400">{app.email}</p>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                {/* Grid columns containing required list data */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500">
                  <div>
                    <span className="font-bold text-zinc-400 block uppercase">Specialty</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-350">
                      {(app.specialties || []).find(s => s.isPrimary)?.specialtyDisplay || "None"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-400 block uppercase">Registration</span>
                    <span className="truncate block font-semibold text-zinc-800 dark:text-zinc-350" title={app.identifiers[0]?.value}>
                      {app.identifiers[0] ? `${app.identifiers[0].issuer}: ${app.identifiers[0].value}` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-400 block uppercase">Organization</span>
                    <span className="truncate block font-semibold text-zinc-800 dark:text-zinc-350">
                      {app.roles.map(r => r.organization?.name).join(", ") || "None"}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-400 block uppercase">Submission Date</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-350">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : new Date(app.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {app.documents.some(d => d.verifiedBy) && (
                    <div className="col-span-2 flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg w-max dark:bg-emerald-950/20 dark:text-emerald-400 font-bold">
                      <ClipboardCheck className="h-3 w-3" />
                      <span>Reviewed by: {app.documents.find(d => d.verifiedBy)?.verifiedBy}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail & Action Panel */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col">
        {selectedApp ? (
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Review Header */}
            <div className="flex justify-between items-start border-b border-zinc-150 pb-4 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest block">Review Profile Specs</span>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                  Dr. {selectedApp.firstName} {selectedApp.lastName}
                </h2>
                <p className="text-xs text-zinc-500">{selectedApp.email} • {selectedApp.phone}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {getStatusBadge(selectedApp.status)}
                {selectedApp.submittedAt && (
                  <span className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">
                    Submitted: {new Date(selectedApp.submittedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Structured Scrollable Details */}
            <div className="space-y-6 flex-1 overflow-y-auto max-h-[550px] pr-2 text-sm text-zinc-700 dark:text-zinc-300">
              
              {/* 1. Identity */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <Globe className="h-4 w-4 text-zinc-500" />
                  1. Identity
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950/40">
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-bold uppercase">Name Fields</span>
                    <span className="font-semibold">{selectedApp.title} {selectedApp.firstName} {selectedApp.middleName} {selectedApp.lastName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-bold uppercase">Display Name</span>
                    <span className="font-semibold">{selectedApp.displayName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-bold uppercase">Gender</span>
                    <span className="font-semibold capitalize">{selectedApp.gender}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-bold uppercase">Birth Date</span>
                    <span className="font-semibold">
                      {selectedApp.birthDate ? new Date(selectedApp.birthDate).toLocaleDateString() : "--"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Credentials */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <Shield className="h-4 w-4 text-zinc-500" />
                  2. Credentials & Registry Identifiers
                </h3>
                {selectedApp.identifiers.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedApp.identifiers.map((i) => (
                      <div key={i.id} className="border border-zinc-150 rounded-2xl p-3.5 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20">
                        <span className="block text-[9px] font-bold text-zinc-400 uppercase">{i.type} Registry</span>
                        <p className="font-bold text-zinc-900 dark:text-zinc-150 mt-1">{i.value}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Issuer: {i.issuer || "National Health Commission"}</p>
                        <p className="text-[9px] font-mono text-zinc-400 truncate mt-0.5">System: {i.system}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No identifiers configured.</p>
                )}
              </div>

              {/* 3. Qualifications */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <BookOpen className="h-4 w-4 text-zinc-500" />
                  3. Qualifications & Board Certifications
                </h3>
                {selectedApp.qualifications.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApp.qualifications.map((q) => (
                      <div key={q.id} className="border border-zinc-150 rounded-2xl p-4 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20 flex gap-3">
                        <BookOpen className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold text-zinc-900 dark:text-zinc-150">{q.degreeName} ({q.qualificationType})</p>
                          <p className="text-xs text-zinc-500">{q.institution} • {q.country}</p>
                          <p className="text-[10px] text-zinc-400">
                            Completed: {q.completionDate} | Cert Number: {q.certificateNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No qualifications defined.</p>
                )}
              </div>

              {/* 4. Practice & Specialties */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  4. Practice Roles & Org Affiliations
                </h3>
                {selectedApp.roles.length > 0 ? (
                  <div className="space-y-3">
                    {selectedApp.roles.map((r) => (
                      <div key={r.id} className="border border-zinc-200 rounded-2xl p-4 space-y-3 dark:border-zinc-800">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Affiliated Organization</span>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{r.organization.name}</h4>
                          <p className="text-xs text-zinc-500">{r.designation} • {r.department || "General Division"}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="block text-[9px] font-bold text-zinc-400 uppercase">Locations Associated</span>
                          <div className="flex flex-col gap-1">
                            {r.locations.map((locLink, idx) => (
                              <div key={idx} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                                {locLink.location.name} ({locLink.location.city}, {locLink.location.state})
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No organization roles registered.</p>
                )}
              </div>

              {/* 5. Services */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <Shield className="h-4 w-4 text-zinc-500" />
                  5. Telemedicine Services & Pricing
                </h3>
                {selectedApp.roles.flatMap(r => r.services).length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedApp.roles.map((r) => (
                      <div key={r.id} className="space-y-2">
                        {r.services.map((s, sIdx) => (
                          <div key={sIdx} className="border border-zinc-150 rounded-2xl p-3 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20">
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded uppercase dark:bg-emerald-950/30 dark:text-emerald-450 font-sans">
                              {s.consultationMode} Mode
                            </span>
                            <h4 className="font-bold text-xs mt-2 text-zinc-900 dark:text-zinc-100">{s.serviceName}</h4>
                            <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 mt-1">
                              Rate: {s.currency} {s.fee} per {s.duration} mins
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No services offering pricing configured.</p>
                )}
              </div>

              {/* 6. Availability */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  6. Consultation Availability Slots
                </h3>
                {selectedApp.roles.flatMap(r => r.availabilities).length > 0 ? (
                  <div className="space-y-3">
                    {selectedApp.roles.map((r) => (
                      <div key={r.id} className="space-y-2 bg-zinc-50/30 p-3.5 rounded-2xl border border-zinc-200 dark:bg-zinc-950/10 dark:border-zinc-800">
                        <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Weekly Slots ({r.organization.name})</span>
                        <div className="grid gap-2 sm:grid-cols-2 text-xs mt-1.5">
                          {r.availabilities.map((a, aIdx) => (
                            <div key={aIdx} className="bg-white border border-zinc-200 rounded-xl p-2.5 flex justify-between font-semibold dark:bg-zinc-900 dark:border-zinc-850">
                              <span className="capitalize">{a.dayOfWeek.toLowerCase()}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{a.availableFrom} - {a.availableTo}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No working availability set.</p>
                )}
              </div>

              {/* 7. Documents */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  7. Uploaded Verification Documents
                </h3>
                {selectedApp.documents.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedApp.documents.map((d) => (
                      <div key={d.id} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/10 dark:border-zinc-800 dark:bg-zinc-950/20 flex flex-col justify-between h-32">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded uppercase dark:bg-zinc-800 dark:text-zinc-300">
                              {d.docType}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">{(d.fileSize ? (d.fileSize / 1024 / 1024).toFixed(2) : "0")} MB</span>
                          </div>
                          <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-2 line-clamp-2">{d.title}</p>
                        </div>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full text-center border border-zinc-200 py-2 rounded-xl bg-white hover:bg-zinc-55 text-xs font-bold transition-all flex items-center justify-center gap-1.5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-850"
                        >
                          <Eye className="h-4 w-4 text-zinc-500" />
                          View File
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No document files attached.</p>
                )}
              </div>

              {/* 8. Consents */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                  <ShieldAlert className="h-4 w-4 text-zinc-500" />
                  8. Platform Consent Specifications
                </h3>
                {selectedApp.consents && selectedApp.consents.length > 0 ? (
                  <div className="space-y-2 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950/40 text-xs">
                    {selectedApp.consents.map((c) => (
                      <div key={c.id} className="flex justify-between py-1 border-b border-zinc-150 last:border-0 dark:border-zinc-850 font-semibold text-zinc-700 dark:text-zinc-300">
                        <span className="capitalize">{c.consentType} Policy</span>
                        <span className="text-emerald-700 dark:text-emerald-450 font-extrabold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Accepted
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No consents registered.</p>
                )}
              </div>

              {/* 9. FHIR Resources Diagnostic Accordion */}
              {fhirPreview && (
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50/40 p-4 space-y-3 dark:border-zinc-850 dark:bg-zinc-950/10">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">FHIR R4 Diagnostic Preview</h4>
                    <button 
                      type="button" 
                      onClick={() => setShowFhirPreview(!showFhirPreview)}
                      className="text-xs font-semibold underline text-zinc-500 hover:text-zinc-850 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {showFhirPreview ? "Hide Preview" : "Show Preview"}
                    </button>
                  </div>
                  
                  {showFhirPreview && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-zinc-400">Validate live serialization models mapping practitioner fields to HL7 resources.</p>
                      
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">Practitioner</span>
                        <pre className="font-mono text-[10px] overflow-x-auto max-h-40 bg-zinc-900 text-zinc-100 p-2.5 rounded-xl">
                          {JSON.stringify(
                            fhirPreview.entry?.find((e: any) => e.resource.resourceType === "Practitioner")?.resource || { error: "Not mapped" },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                      
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">PractitionerRole</span>
                        <pre className="font-mono text-[10px] overflow-x-auto max-h-40 bg-zinc-900 text-zinc-100 p-2.5 rounded-xl">
                          {JSON.stringify(
                            fhirPreview.entry?.find((e: any) => e.resource.resourceType === "PractitionerRole")?.resource || { error: "Not mapped" },
                            null,
                            2
                          )}
                        </pre>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">Organization</span>
                        <pre className="font-mono text-[10px] overflow-x-auto max-h-40 bg-zinc-900 text-zinc-100 p-2.5 rounded-xl">
                          {JSON.stringify(
                            fhirPreview.entry?.find((e: any) => e.resource.resourceType === "Organization")?.resource || { error: "Not mapped" },
                            null,
                            2
                          )}
                        </pre>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">Location</span>
                        <pre className="font-mono text-[10px] overflow-x-auto max-h-40 bg-zinc-900 text-zinc-100 p-2.5 rounded-xl">
                          {JSON.stringify(
                            fhirPreview.entry?.find((e: any) => e.resource.resourceType === "Location")?.resource || { error: "Not mapped" },
                            null,
                            2
                          )}
                        </pre>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450">HealthcareService</span>
                        <pre className="font-mono text-[10px] overflow-x-auto max-h-40 bg-zinc-900 text-zinc-100 p-2.5 rounded-xl">
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

            </div>

            {/* Actions Bar */}
            <div className="border-t border-zinc-150 pt-5 mt-4 space-y-4 dark:border-zinc-800">
              
              {/* Rejection Form Box */}
              {showRejectForm && (
                <div className="space-y-3 bg-red-50/50 p-4 border border-red-200 rounded-2xl dark:bg-red-950/15 dark:border-red-900/30">
                  <label className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-250 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    placeholder="Provide detailed explanation context for this decision..."
                  />
                  {errorMsg && (
                    <p className="text-xs font-semibold text-red-550 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errorMsg}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecision("rejected", rejectionReason)}
                      disabled={actionLoading}
                      className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason("");
                        setErrorMsg("");
                      }}
                      disabled={actionLoading}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Request Corrections/Changes Form Box */}
              {showChangesForm && (
                <div className="space-y-4 bg-amber-50/50 p-4 border border-amber-250 rounded-2xl dark:bg-amber-950/15 dark:border-amber-900/30">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Request Correction Specifications
                    </label>
                    <button 
                      type="button" 
                      onClick={addCorrectionRow} 
                      className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-bold hover:bg-emerald-100"
                    >
                      Add Row +
                    </button>
                  </div>

                  <div className="space-y-3">
                    {correctionItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start border-b border-amber-100 pb-3 last:border-0 dark:border-amber-950/20">
                        <select
                          value={item.field}
                          onChange={(e) => updateCorrectionRow(index, "field", e.target.value)}
                          className="bg-white border border-zinc-250 rounded-xl px-2 py-2 text-xs focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-350"
                        >
                          <option value="registrationNumber">Registration Number</option>
                          <option value="licenseDocument">License Document</option>
                          <option value="degreeCertificate">Degree Certificate</option>
                          <option value="specialties">Specialties Code</option>
                          <option value="availabilities">Availability Slots</option>
                          <option value="consent">Consent Signatures</option>
                          <option value="other">Other Details</option>
                        </select>
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => updateCorrectionRow(index, "reason", e.target.value)}
                          placeholder="Why does this need correction?"
                          className="flex-1 bg-white border border-zinc-250 rounded-xl px-3 py-2 text-xs focus:outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                        />
                        {correctionItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeCorrectionRow(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-semibold text-red-550 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errorMsg}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={submitCorrectionRequests}
                      disabled={actionLoading}
                      className="flex-1 rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
                    >
                      Send Correction Requests
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangesForm(false);
                        setCorrectionItems([{ field: "registrationNumber", reason: "" }]);
                        setErrorMsg("");
                      }}
                      disabled={actionLoading}
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Default Actions Buttons bar */}
              {!showRejectForm && !showChangesForm && (
                <div className="space-y-3">
                  {errorMsg && (
                    <p className="text-xs font-semibold text-red-550 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errorMsg}
                    </p>
                  )}

                  {/* Standard review actions block */}
                  {(selectedApp.status === "SUBMITTED" || selectedApp.status === "UNDER_REVIEW" || selectedApp.status === "CHANGES_REQUESTED") && (
                    <div className="grid gap-3 grid-cols-3">
                      <button
                        type="button"
                        onClick={() => handleDecision("approved")}
                        disabled={actionLoading}
                        className="col-span-3 sm:col-span-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-3 text-xs font-bold text-white hover:bg-green-700 active:scale-[0.99] transition-transform disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChangesForm(true)}
                        disabled={actionLoading}
                        className="col-span-3 sm:col-span-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white hover:bg-amber-700 active:scale-[0.99] transition-transform disabled:opacity-50"
                      >
                        <FileClock className="h-4 w-4" />
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectForm(true)}
                        disabled={actionLoading}
                        className="col-span-3 sm:col-span-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-700 active:scale-[0.99] transition-transform disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Suspension block if profile is currently verified */}
                  {selectedApp.status === "VERIFIED" && (
                    <button
                      type="button"
                      onClick={() => handleDecision("suspended")}
                      disabled={actionLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-3.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-transform active:scale-[0.99]"
                    >
                      <Ban className="h-4 w-4" />
                      Suspend Access (Deactivate Provider)
                    </button>
                  )}

                  {/* Re-verify block if suspended */}
                  {selectedApp.status === "SUSPENDED" && (
                    <button
                      type="button"
                      onClick={() => handleDecision("approved")}
                      disabled={actionLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-3.5 text-xs font-bold text-white hover:bg-green-700 transition-transform active:scale-[0.99]"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Re-Verify & Re-Activate Access
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center text-zinc-400">
            <Eye className="h-12 w-12 mb-3 opacity-30 animate-pulse text-zinc-500" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Practitioner Review Workspace</h3>
            <p className="text-xs max-w-xs mt-1 text-zinc-505 dark:text-zinc-400">
              Select an onboarding application from the list to preview demographic registry credentials, verify qualifications, and manage statuses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
