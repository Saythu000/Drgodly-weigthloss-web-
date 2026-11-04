import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Check, Sparkles } from "lucide-react";
import { eventItems } from "@/lib/events";
import EventRegisterForm from "./EventRegisterForm";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return eventItems.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = eventItems.find((item) => item.slug === slug);

  if (!event) {
    return { title: "Event" };
  }

  return {
    title: event.title,
    description: event.description,
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = eventItems.find((item) => item.slug === slug);

  if (!event) {
    notFound();
  }

  const isAIDoctors = event.slug === "artificial-intelligence-for-doctors";

  // Host info mapping
  const host = {
    name: isAIDoctors ? "Dr. Kalyan Kalwa" : "Dr. Kalyan Kalwa",
    role: isAIDoctors ? "Chief Medical AI Advisor, DrGodly" : "Medical Director, DrGodly",
    bio: isAIDoctors
      ? "Dr. Kalyan Kalwa is a leading expert in digital health innovation, medical informatics, and automated clinical workflow modeling. He guides research on secure clinical AI copilot deployments."
      : "Dr. Kalyan Kalwa is a leading expert in clinical weight management, nutrition science, metabolic health, and diabetes care. He leads the clinical onboarding and verification process.",
    image: "/Dr.%20Kalyan%20Kalwa.jpg",
  };

  const sessionAbout = isAIDoctors
    ? "This masterclass is designed specifically for healthcare professionals looking to leverage state-of-the-art AI systems in clinical practice. We will demonstrate how generative AI models, machine learning diagnostics, and clinical copilot frameworks are transforming medical billing, patient chart summaries, EMR entry, and clinical workflow efficiency."
    : "This clinician-led information seminar is designed specifically for individuals who are evaluating metabolic weight management programs. Our focus is to deliver transparent, medically backed answers regarding GLP-1 and dual GIP/GLP-1 receptor agonist pathways, eligibility screening protocols, and safe titration schedules.";

  const points = isAIDoctors
    ? [
        "Practical overview of LLM capabilities and limitations in diagnosis.",
        "Secure EHR/EMR automatic note charting integration workflows.",
        "Best practices for HIPAA and patient data privacy compliance in AI.",
        "Live demonstration of medical copilots writing clinical notes."
      ]
    : [
        "Clear explanation of how GLP-1 hormone mimics work.",
        "Step-by-step walkthrough of the safety intake process.",
        "Insight into managing and mitigating digestive side effects.",
        "Guidance on building dietary habits for muscle preservation."
      ];

  // Agenda timeline mapping based on slug
  const agenda = isAIDoctors
    ? [
        { time: "07:00 PM - 07:15 PM", title: "AI in Medicine: The State of the Art", desc: "Understanding the role of Large Language Models (LLMs) and predictive analytics in clinical settings." },
        { time: "07:15 PM - 07:35 PM", title: "EHR/EMR Copilots & Speech-to-Text Charting", desc: "Demonstrating how AI can listen to patient encounters and draft highly accurate clinical charts automatically." },
        { time: "07:35 PM - 07:50 PM", title: "Patient Privacy & HIPAA Compliance", desc: "How to ensure safety, minimize liability, and securely process medical records under HIPAA standards." },
        { time: "07:50 PM - 08:00 PM", title: "Interactive Workshop & Open Q&A", desc: "Live session discussing integration steps for private practices and hospitals." }
      ]
    : [
        { time: "00:00 - 00:15", title: "Welcome & Metabolic Intake Overview", desc: "A detailed breakdown of how the DrGodly doctor-guided onboarding workflow operates." },
        { time: "00:15 - 00:35", title: "Clinical Eligibility & Safety Screening", desc: "Explaining how contraindications, lab results, and patient history determine clinical suitability." },
        { time: "00:35 - 00:50", title: "Sourcing, Pricing, and Consultation Options", desc: "Verifying authentic drug supplies, dosage titration guidelines, and plan costs." },
        { time: "00:50 - 01:00", title: "Live Audience Q&A Session", desc: "Open session with Dr. Kalyan Kalwa resolving general questions about the program." }
      ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white/70 py-16 dark:border-zinc-800/80 dark:bg-zinc-900/40 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
          <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Sparkles className="h-3 w-3" />
            Live Event Session
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl max-w-4xl">
            {event.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-xl max-w-3xl">
            {event.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {event.date}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {event.time}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {event.location}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Body (Two-Column Grid) */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* Left Side: Details & Host */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Event Image */}
              {event.image && (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-md">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover transition-transform duration-500 hover:scale-[1.01]"
                    priority
                  />
                </div>
              )}

              {/* Event Details Card */}
              <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/60 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 backdrop-blur-md space-y-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">About This Session</h2>
                <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-lg">
                  {sessionAbout}
                </p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">What You Will Learn:</h3>
                  <ul className="grid gap-3 sm:grid-cols-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Event Agenda Timeline */}
              <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/60 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 backdrop-blur-md">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">Agenda Timeline</h2>
                <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-8">
                  {agenda.map((item, index) => (
                    <div key={index} className="relative">
                      <span className="absolute -left-[31px] top-1 flex h-4 w-4 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-zinc-900" />
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {item.time}
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Host Biography */}
              <aside className="flex flex-col gap-6 rounded-2xl sm:rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 backdrop-blur-md sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-emerald-500/20 sm:h-24 sm:w-24 bg-zinc-100">
                  <Image
                    src={host.image}
                    alt={host.name}
                    title={host.name}
                    fill
                    sizes="(max-width: 768px) 80px, 96px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Session Lead Host</p>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{host.name}</h3>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {host.role}
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{host.bio}</p>
                </div>
              </aside>
            </div>

            {/* Right Side: Sticky Registration Sidebar */}
            <div className="lg:col-span-1 lg:sticky lg:top-8 h-fit">
              <EventRegisterForm
                eventTitle={event.title}
                eventDate={event.date}
                eventTime={event.time}
              />
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
