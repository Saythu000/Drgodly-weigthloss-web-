'use client';

import React from 'react';

export default function DigitalMarketingPage() {
  const comingSoonFeatures = [
    {
      id: 'feature-meta',
      title: 'Meta & Instagram Ads',
      icon: 'campaign',
      badge: 'Coming Soon',
      description:
        'Craft highly targeted social ad campaigns, manage ad spend budgets, and track patient acquisition leads directly inside DrGodly CRM.',
      metrics: [
        { label: 'Targeting', val: 'Healthcare Demographics' },
        { label: 'Formats', val: 'Carousels & Reels' },
      ],
      tags: ['Facebook', 'Instagram', 'Lead Ads'],
    },
    {
      id: 'feature-ai-copy',
      title: 'AI Healthcare Copywriter',
      icon: 'psychology',
      badge: 'Coming Soon',
      description:
        'Generate HIPAA-compliant, Meta policy-approved marketing copy for patient consultation landing pages, blogs, and email dispatches.',
      metrics: [
        { label: 'Compliance', val: '100% Policy Checked' },
        { label: 'Templates', val: 'GLP-1 Medical Prompts' },
      ],
      tags: ['GPT-4o', 'Medical Compliance', 'Auto-Copy'],
    },
    {
      id: 'feature-roas',
      title: 'Multi-Channel ROAS Analytics',
      icon: 'analytics',
      badge: 'Coming Soon',
      description:
        'Consolidated performance dashboards comparing patient acquisition cost (CPL), return on ad spend (ROAS), and multi-channel attribution.',
      metrics: [
        { label: 'Attribution', val: 'Multi-Touch Tracking' },
        { label: 'Metrics', val: 'CPL & ROAS ROI' },
      ],
      tags: ['Analytics', 'CPL Tracker', 'ROI Reports'],
    },
    {
      id: 'feature-pmax',
      title: 'Google Ads Performance Max',
      icon: 'auto_awesome',
      badge: 'V2.0 Exclusive',
      description:
        'Leverage AI for optimal ad placement across Search, Display, YouTube, and Gmail to reach eligible patients seeking GLP-1 weight loss.',
      metrics: [
        { label: 'Channels', val: 'Search, YouTube, Gmail' },
        { label: 'Optimization', val: 'Smart Bidding AI' },
      ],
      tags: ['Google Ads', 'PMax', 'Search & Video'],
    },
  ];

  return (
    <main id="section-marketing" className="flex-1 overflow-y-auto p-8 bg-surface custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Main Brand-Matched Glassmorphism Container */}
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-[0px_4px_25px_rgba(0,26,63,0.06)] overflow-hidden">
          {/* Dark Navy Header Banner (#001a3f) matching DrGodly Brand */}
          <div className="bg-primary text-white p-10 text-center relative overflow-hidden">
            {/* Ambient Teal Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[11px] font-bold tracking-wider uppercase text-secondary">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span>DrGodly Telehealth Enterprise Roadmap</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                COMING SOON - V2.0 UPGRADE
              </h1>

              <p className="text-secondary text-sm font-semibold max-w-xl mx-auto">
                Feature Unlocks in Upcoming Release v2.0
              </p>

              <p className="text-white/70 text-xs max-w-2xl mx-auto leading-relaxed pt-1">
                Our major multi-channel marketing and AI ad copy suite is under active development. Unlock advanced patient lead targeting, real-time ROAS analytics, and automated healthcare compliance checks in the upcoming DrGodly Web v2.0 update!
              </p>
            </div>
          </div>

          {/* 4 Feature Preview Cards Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comingSoonFeatures.map((feat) => (
                <div
                  key={feat.id}
                  className="bg-surface border border-secondary/30 hover:border-secondary rounded-2xl p-6 transition-all duration-300 shadow-sm flex flex-col justify-between space-y-5 group hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Card Header: Icon + Title + Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                          <span className="material-symbols-outlined text-2xl">{feat.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-on-surface">{feat.title}</h3>
                          <span className="text-[10px] font-mono text-on-surface-variant/70 block">
                            DrGodly Module #v2
                          </span>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {feat.badge}
                      </span>
                    </div>

                    {/* Feature Description */}
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {feat.description}
                    </p>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {feat.metrics.map((m, idx) => (
                        <div key={idx} className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
                          <span className="text-[9px] text-on-surface-variant/60 font-bold uppercase block">{m.label}</span>
                          <span className="text-xs font-bold text-on-surface font-mono">{m.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {feat.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-semibold rounded-md border border-outline-variant/20"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-secondary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Preview</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
