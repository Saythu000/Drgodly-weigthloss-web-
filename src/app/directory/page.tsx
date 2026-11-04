"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, SlidersHorizontal, Globe, Calendar, MapPin, 
  ShieldCheck, BookOpen, Heart, Clock, User, DollarSign, 
  Video, PhoneCall, MessageSquare, BadgeAlert, Layers, Copy, Check, X, ArrowLeft
} from "lucide-react";
import AppHeader from "@/components/AppHeader";

interface Provider {
  id: string;
  displayName: string;
  photo: string | null;
  professionalBio: string | null;
  yearsOfExperience: number;
  gender: string;
  status: string;
  languages: Array<{ languageName: string; proficiency: string }>;
  specialties: Array<{ specialtyDisplay: string; isPrimary: boolean }>;
  qualifications: Array<{ degreeName: string; institution: string; completionDate: string }>;
  roles: Array<{
    id: string;
    designation: string;
    organizationName: string;
    locations: Array<{ name: string; city: string; state: string }>;
    services: Array<{ serviceName: string; consultationMode: string; fee: number; currency: string; duration: number }>;
  }>;
  nextAvailableAppointment: string;
  fhir: {
    practitioner: any;
    practitionerRoles: any[];
  };
}

export default function DirectoryPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  
  // Detail Overlay Modal State
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "fhir">("details");
  const [fhirTab, setFhirTab] = useState<"practitioner" | "role">("practitioner");
  const [copied, setCopied] = useState(false);

  // Load provider directory data
  const loadDirectory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/directory");
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
        setFilteredProviders(data);
      }
    } catch (err) {
      console.error("Failed to load provider directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  // Filter providers in memory upon query changes
  useEffect(() => {
    let result = providers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const fullName = p.displayName.toLowerCase();
        const bio = p.professionalBio?.toLowerCase() || "";
        const specs = p.specialties.map(s => s.specialtyDisplay.toLowerCase()).join(" ");
        const orgs = p.roles.map(r => r.organizationName.toLowerCase()).join(" ");
        const locs = p.roles.flatMap(r => r.locations.map(l => l.name.toLowerCase() + " " + l.city.toLowerCase() + " " + l.state.toLowerCase())).join(" ");
        const services = p.roles.flatMap(r => r.services.map(s => s.serviceName.toLowerCase())).join(" ");

        return fullName.includes(q) || bio.includes(q) || specs.includes(q) || orgs.includes(q) || locs.includes(q) || services.includes(q);
      });
    }

    if (selectedSpecialty !== "all") {
      result = result.filter(p => p.specialties.some(s => s.specialtyDisplay === selectedSpecialty));
    }

    if (selectedOrg !== "all") {
      result = result.filter(p => p.roles.some(r => r.organizationName === selectedOrg));
    }

    if (selectedLanguage !== "all") {
      result = result.filter(p => p.languages.some(l => l.languageName === selectedLanguage));
    }

    if (selectedMode !== "all") {
      result = result.filter(p => p.roles.some(r => r.services.some(s => s.consultationMode.toLowerCase() === selectedMode.toLowerCase())));
    }

    setFilteredProviders(result);
  }, [searchQuery, selectedSpecialty, selectedOrg, selectedLanguage, selectedMode, providers]);

  // Extract filters lookups
  const specialties = Array.from(new Set(providers.flatMap(p => p.specialties.map(s => s.specialtyDisplay)).filter(Boolean)));
  const organizations = Array.from(new Set(providers.flatMap(p => p.roles.map(r => r.organizationName)).filter(Boolean)));
  const languages = Array.from(new Set(providers.flatMap(p => p.languages.map(l => l.languageName)).filter(Boolean)));

  const handleCopyFhir = (json: any) => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case "video":
        return <Video className="h-3 w-3" />;
      case "audio":
        return <PhoneCall className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  const renderInitialAvatar = (name: string) => {
    const letters = name.replace("Dr. ", "").split(" ");
    const init = letters.map(l => l[0]).join("").toUpperCase().substring(0, 2);
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 text-lg font-black dark:bg-emerald-950 dark:text-emerald-300">
        {init || "DR"}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header Navigation */}
      <AppHeader activePath="/directory" />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        
        {/* Directory Title */}
        <div className="space-y-2 text-center sm:text-left mb-10 mt-4">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-55 sm:text-4xl">
            Find Your Care Provider
          </h1>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Explore and connect with verified medical practitioners, check availability slots, and access interoperable FHIR health records.
          </p>
        </div>

        {/* Filters and Search Bar Section */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          
          {/* Filters Sidebar */}
          <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-850 dark:bg-zinc-900/60 backdrop-blur-md space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-150 dark:border-zinc-800">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Refine Search</h2>
            </div>

            {/* Specialty Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              >
                <option value="all">All Specialties</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Organization Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Organization</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              >
                <option value="all">All Organizations</option>
                {organizations.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Language Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Consultation Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              >
                <option value="all">All Languages</option>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Consultation Mode Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Consultation Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-700 focus:outline-none dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
              >
                <option value="all">All Modes</option>
                <option value="video">Video Consultation</option>
                <option value="audio">Audio Consultation</option>
                <option value="chat">Chat Consultation</option>
              </select>
            </div>

            {/* Clear filters */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedSpecialty("all");
                setSelectedOrg("all");
                setSelectedLanguage("all");
                setSelectedMode("all");
              }}
              className="w-full text-center border border-zinc-250 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-all dark:border-zinc-800 dark:hover:bg-zinc-850"
            >
              Reset Filters
            </button>
          </aside>

          {/* Search Bar & Grid Panel */}
          <div className="space-y-6">
            
            {/* Search Input Box */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search practitioners by name, specialty, clinical services, locations, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none shadow-sm dark:bg-zinc-900/60 dark:border-zinc-850 dark:text-zinc-100"
              />
            </div>

            {/* Providers Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent mx-auto"></div>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-20 border border-zinc-200 rounded-3xl bg-white dark:border-zinc-850 dark:bg-zinc-900/40 text-zinc-400">
                <BadgeAlert className="h-10 w-10 mx-auto opacity-50 mb-2" />
                <p className="font-bold text-sm">No providers match your search.</p>
                <p className="text-xs mt-1">Try refining search parameters or adjusting keyword filters.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredProviders.map(provider => {
                  const primaryRole = provider.roles[0];
                  const primaryLoc = primaryRole?.locations[0];
                  const primaryService = primaryRole?.services[0];
                  const primarySpec = provider.specialties.find(s => s.isPrimary) || provider.specialties[0];

                  return (
                    <div 
                      key={provider.id}
                      className="group rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-850 dark:bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between"
                    >
                      <div>
                        {/* Profile Photo / Initials Header */}
                        <div className="flex gap-4 items-start">
                          {provider.photo ? (
                            <img
                              src={provider.photo}
                              alt={provider.displayName}
                              className="h-16 w-16 rounded-2xl object-cover border border-zinc-200 shrink-0 dark:border-zinc-800"
                            />
                          ) : (
                            renderInitialAvatar(provider.displayName)
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-black text-base text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                {provider.displayName}
                              </h3>
                              {provider.status === "VERIFIED" && (
                                <span title="Verified Practitioner">
                                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 fill-emerald-100 dark:fill-emerald-950/20" />
                                </span>
                              )}
                            </div>
                            <span className="inline-flex text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg dark:bg-emerald-950/40 dark:text-emerald-400">
                              {primarySpec?.specialtyDisplay || "General Practice"}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                              <BookOpen className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[170px]" title={provider.qualifications.map(q => q.degreeName).join(", ")}>
                                {provider.qualifications[0]?.degreeName || "Medical Graduate"} • {provider.yearsOfExperience} yrs exp
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle practice specifications info */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-550 dark:text-zinc-400">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">Hospital/Practice</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-300 block truncate">
                              {primaryRole?.organizationName || "Independent"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">Location</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-300 block truncate flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                              {primaryLoc ? `${primaryLoc.city}, ${primaryLoc.state}` : "Virtual Care"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">Languages</span>
                            <span className="font-semibold block truncate" title={provider.languages.map(l => l.languageName).join(", ")}>
                              {provider.languages.map(l => l.languageName).join(", ")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">Consulting Rate</span>
                            <span className="font-extrabold text-emerald-600 block dark:text-emerald-400">
                              {primaryService ? `${primaryService.currency} ${primaryService.fee}` : "Varies"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom availability & View CTA */}
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-500 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[140px]" title={provider.nextAvailableAppointment}>
                            {provider.nextAvailableAppointment}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProvider(provider);
                            setActiveTab("details");
                            setFhirTab("practitioner");
                          }}
                          className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 font-bold text-zinc-700 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </main>

      {/* Profile & Interoperability overlay modal */}
      {activeProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-start shrink-0">
              <div className="flex gap-4 items-center">
                {activeProvider.photo ? (
                  <img
                    src={activeProvider.photo}
                    alt={activeProvider.displayName}
                    className="h-14 w-14 rounded-2xl object-cover border border-zinc-200 dark:border-zinc-800"
                  />
                ) : (
                  renderInitialAvatar(activeProvider.displayName)
                )}
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                    {activeProvider.displayName}
                    {activeProvider.status === "VERIFIED" && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 fill-emerald-100 dark:fill-emerald-950/20" />}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {activeProvider.specialties.find(s => s.isPrimary)?.specialtyDisplay || "Specialist Practitioner"} • {activeProvider.yearsOfExperience} Years Exp
                  </p>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => setActiveProvider(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "details"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-450"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                Profile Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fhir")}
                className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "fhir"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-450"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                <Layers className="h-4 w-4" />
                Interoperability (FHIR R4)
              </button>
            </div>

            {/* Modal Scrollable Content body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {activeTab === "details" ? (
                <>
                  {/* Biography */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Professional Biography</h4>
                    <p className="text-xs leading-relaxed text-zinc-650 dark:text-zinc-350">
                      {activeProvider.professionalBio || "No biography provided."}
                    </p>
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Board Qualifications & Degrees</h4>
                    <div className="grid gap-2">
                      {activeProvider.qualifications.map((q, idx) => (
                        <div key={idx} className="flex gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 dark:bg-zinc-950/40 dark:border-zinc-850">
                          <BookOpen className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">{q.degreeName}</p>
                            <p className="text-[11px] text-zinc-450">{q.institution} • Completed {q.completionDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Languages Spoken</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeProvider.languages.map((l, idx) => (
                        <span key={idx} className="inline-flex text-xs font-semibold bg-zinc-100 text-zinc-800 px-3 py-1 rounded-xl dark:bg-zinc-850 dark:text-zinc-350">
                          {l.languageName} ({l.proficiency})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Clinics & Consultation Roles */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Practicing Roles & Facility Details</h4>
                    <div className="space-y-3">
                      {activeProvider.roles.map((r, idx) => (
                        <div key={idx} className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/10 dark:border-zinc-850/60 dark:bg-zinc-950/15 space-y-3">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-450 uppercase">{r.organizationName}</span>
                            <h5 className="text-sm font-black text-zinc-900 dark:text-white">{r.designation}</h5>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="block text-[9px] font-bold text-zinc-400 uppercase">Consultation Modes & Rates</span>
                            <div className="flex flex-wrap gap-2">
                              {r.services.map((s, sIdx) => (
                                <div key={sIdx} className="bg-white border border-zinc-200/60 rounded-xl px-3 py-2 flex items-center gap-1.5 dark:bg-zinc-900 dark:border-zinc-800 text-xs font-semibold">
                                  {getModeIcon(s.consultationMode)}
                                  <span className="capitalize">{s.consultationMode}:</span>
                                  <span className="text-emerald-600 dark:text-emerald-450 font-bold">{s.currency} {s.fee} ({s.duration} mins)</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-[9px] font-bold text-zinc-400 uppercase">Clinic Locations</span>
                            {r.locations.map((loc, lIdx) => (
                              <div key={lIdx} className="text-xs font-semibold text-zinc-650 dark:text-zinc-405 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                                {loc.name} — {loc.city}, {loc.state}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Appointment Call-to-action */}
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-950/20 dark:border-zinc-850 gap-4 shrink-0">
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-zinc-400 uppercase">Next Availability Slot</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        {activeProvider.nextAvailableAppointment}
                      </p>
                    </div>
                    <Link
                      href="/intake"
                      onClick={() => setActiveProvider(null)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-6 text-xs font-bold text-white text-center shadow-sm active:scale-[0.98]"
                    >
                      Book Consultation
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-5 flex flex-col h-full">
                  {/* FHIR Sub Navigation tabs */}
                  <div className="flex gap-2 p-1 bg-zinc-50 border border-zinc-200 rounded-xl dark:bg-zinc-950/80 dark:border-zinc-850 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFhirTab("practitioner")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        fhirTab === "practitioner"
                          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50 dark:bg-zinc-900 dark:text-white dark:border-zinc-800"
                          : "text-zinc-400 hover:text-zinc-650"
                      }`}
                    >
                      Practitioner
                    </button>
                    <button
                      type="button"
                      onClick={() => setFhirTab("role")}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        fhirTab === "role"
                          ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50 dark:bg-zinc-900 dark:text-white dark:border-zinc-800"
                          : "text-zinc-400 hover:text-zinc-650"
                      }`}
                    >
                      PractitionerRole
                    </button>
                  </div>

                  {/* Pre JSON Box with Copy button */}
                  <div className="flex-1 flex flex-col bg-zinc-900 text-zinc-150 rounded-2xl overflow-hidden border border-zinc-800 min-h-[300px]">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-450 uppercase font-bold">
                        {fhirTab === "practitioner" ? "Practitioner" : "PractitionerRole"} resource payload
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => handleCopyFhir(fhirTab === "practitioner" ? activeProvider.fhir.practitioner : activeProvider.fhir.practitionerRoles)}
                        className="text-[10px] flex items-center gap-1 font-bold text-zinc-400 hover:text-white"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy JSON
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 font-mono text-xs overflow-auto flex-1 text-left max-h-[350px]">
                      {JSON.stringify(
                        fhirTab === "practitioner" 
                          ? activeProvider.fhir.practitioner 
                          : activeProvider.fhir.practitionerRoles, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                  
                  <div className="text-[10px] text-zinc-400 leading-relaxed text-left shrink-0">
                    <p className="font-bold flex items-center gap-1 text-zinc-550 dark:text-zinc-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Patient Data Security Constraints Enforced:
                    </p>
                    <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5">
                      <li>Internal database user accounts, session tokens, and ID mapping links are completely excluded.</li>
                      <li>Private onboarding verification metadata and internal reviewer identifiers are hidden.</li>
                      <li>Verification certificates, medical license keys, and security checksum checks are omitted.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
