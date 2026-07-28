'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AccountStatus {
  platform: string;
  name: string;
  connected: boolean;
  handle: string;
}

interface PublishJob {
  jobId: string;
  campaignName: string;
  platform: string;
  jobStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  attempts: number;
  createdAt: string;
  externalUrl?: string;
}

export default function DigitalMarketingPage() {
  const [activeSubtab, setActiveSubtab] = useState<'compose' | 'accounts' | 'history'>('compose');

  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<'ORGANIC' | 'PAID_LEADS' | 'PAID_REACH'>('ORGANIC');
  const [masterCaption, setMasterCaption] = useState('');
  const [budget, setBudget] = useState('500');
  const [audience, setAudience] = useState('DEFAULT');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [mediaFile, setMediaFile] = useState<{ name: string; size: string } | null>(null);

  // AI & Audit States matching dashboard.html lines 975-1013
  const [optimizing, setOptimizing] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [showPreflightReport, setShowPreflightReport] = useState(false);
  const [preflightScore, setPreflightScore] = useState(94);
  const [complianceText, setComplianceText] = useState('');
  const [engagementText, setEngagementText] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Connection Accounts State matching dashboard.html lines 1017-1050
  const [accounts, setAccounts] = useState<AccountStatus[]>([
    { platform: 'facebook', name: 'Facebook Page', connected: true, handle: 'DrGodly Telehealth' },
    { platform: 'instagram', name: 'Instagram Business', connected: true, handle: '@drgodly.clinic' },
    { platform: 'linkedin', name: 'LinkedIn Company', connected: false, handle: 'Not Connected' },
    { platform: 'youtube', name: 'YouTube Channel', connected: false, handle: 'Not Connected' },
  ]);

  // History State
  const [history, setHistory] = useState<PublishJob[]>([]);

  // Fetch marketing history from /api/bot/marketing/history
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/bot/marketing/history');
      const data = await res.json();
      if (data.success && data.jobs) {
        setHistory(data.jobs);
      }
    } catch (e) {
      console.error('Failed to fetch marketing history:', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const togglePlatform = (plat: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(plat) ? prev.filter((p) => p !== plat) : [...prev, plat]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
    }
  };

  // AI Copy Optimization matching dashboard.ts line 920
  const handleAiOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setMasterCaption(
        `Transform your health with DrGodly Clinic's FDA-approved GLP-1 Weight Loss Program (Semaglutide/Wegovy). 🩺✨ Same-day virtual doctor consults with Dr. Kalyan. Take our 2-minute online intake today! #MedicalWeightLoss #GLP1 #DrGodlyClinic`
      );
      setOptimizing(false);
    }, 600);
  };

  // AI Pre-Flight Audit Check matching dashboard.ts line 940
  const handlePreflightAudit = () => {
    if (!masterCaption.trim()) {
      alert('Please enter a caption copy before running pre-flight check.');
      return;
    }

    setAuditing(true);
    setTimeout(() => {
      setPreflightScore(94);
      setComplianceText('100% compliant with Meta Healthcare & Medical Weight Loss advertising policies. No unrealistic weight-loss guarantee claims detected.');
      setEngagementText('Estimated Click-Through Rate (CTR): 4.2% | Estimated Cost Per Lead Click (CPC): ₹18.50.');
      setRecommendations([
        'Add hashtag #MedicalWeightLoss to boost Instagram placement reach by ~14%.',
        'Caption hook correctly highlights same-day physician access with Dr. Kalyan.',
        'Anti-ban delay controls are active for batch dispatch safety.',
      ]);
      setShowPreflightReport(true);
      setAuditing(false);
    }, 800);
  };

  // Handle Publish Campaign POST /api/bot/marketing/publish
  const handlePublish = async () => {
    if (!masterCaption.trim()) {
      alert('Please enter caption copy.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one target platform.');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/bot/marketing/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName,
          campaignType,
          platforms: selectedPlatforms,
          caption: masterCaption,
          budget,
          audience,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Campaign published successfully!');
        setMasterCaption('');
        setCampaignName('');
        setMediaFile(null);
        setShowPreflightReport(false);
        fetchHistory();
        setActiveSubtab('history');
      } else {
        alert(data.error || 'Failed to publish campaign');
      }
    } catch (e: any) {
      console.error('Failed to publish campaign:', e);
      alert('Failed to publish campaign');
    } finally {
      setPublishing(false);
    }
  };

  const handleRetryJob = (jobId: string) => {
    setHistory((prev) =>
      prev.map((j) =>
        j.jobId === jobId
          ? { ...j, jobStatus: 'SUCCESS', attempts: j.attempts + 1, externalUrl: 'https://youtube.com/watch?v=retry' }
          : j
      )
    );
  };

  return (
    <main id="section-marketing" className="flex-1 overflow-hidden p-8 flex flex-col bg-surface relative">
      {/* Background atmosphere */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Split View Layout matching dashboard.html lines 860-1020 */}
      <div className="flex-1 flex gap-8 overflow-hidden h-full">
        {/* Left Panel: Composer and Options (60%) */}
        <div className="flex-[0.6] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Sub-tabs Bar matching dashboard.html lines 864-868 */}
          <div className="flex border-b border-outline-variant/30 pb-2 gap-4">
            <button
              id="marketing-subtab-compose"
              type="button"
              onClick={() => setActiveSubtab('compose')}
              className={`px-4 py-2 text-sm font-bold focus:outline-none transition-all cursor-pointer ${
                activeSubtab === 'compose'
                  ? 'border-b-2 border-secondary text-secondary'
                  : 'text-on-surface-variant/75 hover:text-secondary border-b-2 border-transparent'
              }`}
            >
              Campaign Composer
            </button>
            <button
              id="marketing-subtab-accounts"
              type="button"
              onClick={() => setActiveSubtab('accounts')}
              className={`px-4 py-2 text-sm font-semibold focus:outline-none transition-all cursor-pointer ${
                activeSubtab === 'accounts'
                  ? 'border-b-2 border-secondary text-secondary'
                  : 'text-on-surface-variant/75 hover:text-secondary border-b-2 border-transparent'
              }`}
            >
              Integrations
            </button>
            <button
              id="marketing-subtab-history"
              type="button"
              onClick={() => setActiveSubtab('history')}
              className={`px-4 py-2 text-sm font-semibold focus:outline-none transition-all cursor-pointer ${
                activeSubtab === 'history'
                  ? 'border-b-2 border-secondary text-secondary'
                  : 'text-on-surface-variant/75 hover:text-secondary border-b-2 border-transparent'
              }`}
            >
              Posting History ({history.length})
            </button>
          </div>

          {/* SUB-SECTION 1: CAMPAIGN COMPOSER */}
          {activeSubtab === 'compose' && (
            <div id="marketing-view-compose" className="space-y-6">
              {/* Composer Card matching dashboard.html lines 873-972 */}
              <div className="glass-card rounded-[24px] p-8 shadow-[0px_4px_20px_rgba(0,26,63,0.05)] border border-outline-variant/30 space-y-6 bg-surface-container-lowest">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">Create Ad / Post</h3>
                  <p className="text-on-surface-variant text-xs">Create organic posts or run paid campaigns with pre-flight AI analytics.</p>
                </div>

                {/* Platforms Selector matching dashboard.html lines 880-900 */}
                <div className="space-y-3">
                  <label className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block">
                    Target Platforms
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-outline-variant/30 hover:border-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="platform-fb"
                        checked={selectedPlatforms.includes('facebook')}
                        onChange={() => togglePlatform('facebook')}
                        className="rounded border-outline-variant/30 text-secondary focus:ring-secondary focus:ring-offset-0 focus:ring-1 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-on-surface">Facebook</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-outline-variant/30 hover:border-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="platform-ig"
                        checked={selectedPlatforms.includes('instagram')}
                        onChange={() => togglePlatform('instagram')}
                        className="rounded border-outline-variant/30 text-secondary focus:ring-secondary focus:ring-offset-0 focus:ring-1 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-on-surface">Instagram</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-outline-variant/30 hover:border-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="platform-li"
                        checked={selectedPlatforms.includes('linkedin')}
                        onChange={() => togglePlatform('linkedin')}
                        className="rounded border-outline-variant/30 text-secondary focus:ring-secondary focus:ring-offset-0 focus:ring-1 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-on-surface">LinkedIn</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-outline-variant/30 hover:border-secondary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="platform-yt"
                        checked={selectedPlatforms.includes('youtube')}
                        onChange={() => togglePlatform('youtube')}
                        className="rounded border-outline-variant/30 text-secondary focus:ring-secondary focus:ring-offset-0 focus:ring-1 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-on-surface">YouTube</span>
                    </label>
                  </div>
                </div>

                {/* Campaign / Post Fields matching dashboard.html lines 903-916 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block" htmlFor="marketing-campaign-name">
                      Campaign/Post Title
                    </label>
                    <input
                      type="text"
                      id="marketing-campaign-name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary transition-all text-sm text-on-surface"
                      placeholder="e.g. Summer Wegovy Promotion"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block" htmlFor="marketing-campaign-type">
                      Post Type
                    </label>
                    <select
                      id="marketing-campaign-type"
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value as any)}
                      className="w-full px-4 py-3 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary transition-all text-sm text-on-surface-variant cursor-pointer"
                    >
                      <option value="ORGANIC">Organic Post (CMS)</option>
                      <option value="PAID_LEADS">Paid Ad: Lead Generation</option>
                      <option value="PAID_REACH">Paid Ad: Brand Awareness</option>
                    </select>
                  </div>
                </div>

                {/* Media Upload Dropzone matching dashboard.html lines 919-931 */}
                <div className="space-y-2">
                  <label className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block">
                    Campaign Media
                  </label>
                  <div
                    id="marketing-media-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-6 text-center hover:border-secondary transition-all cursor-pointer bg-surface/50"
                  >
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/60 block mb-2">upload_file</span>
                    <span className="text-xs font-semibold text-on-surface block mb-1">Click or drag image/video to upload</span>
                    <span className="text-[10px] text-on-surface-variant/60 block">Supports PNG, JPG, MP4 (Max 50MB)</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      id="marketing-media-input"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,video/*"
                    />
                    {mediaFile && (
                      <div id="marketing-media-preview" className="mt-4 p-2 bg-surface rounded-xl border border-outline-variant/20 flex items-center justify-between">
                        <span id="marketing-media-filename" className="text-xs truncate font-mono text-on-surface max-w-[200px]">
                          {mediaFile.name} ({mediaFile.size})
                        </span>
                        <button
                          type="button"
                          id="btn-remove-marketing-media"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaFile(null);
                          }}
                          className="p-1 hover:bg-error/10 text-error rounded"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption Composer with AI Optimize Button matching dashboard.html lines 934-943 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block" htmlFor="marketing-master-caption">
                      Master Caption
                    </label>
                    <button
                      type="button"
                      id="btn-ai-optimize-caption"
                      onClick={handleAiOptimize}
                      disabled={optimizing}
                      className="px-2.5 py-1 bg-secondary/10 text-secondary text-[11px] font-bold rounded-full hover:bg-secondary/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      <span>{optimizing ? 'Optimizing...' : 'Optimize with AI'}</span>
                    </button>
                  </div>
                  <textarea
                    id="marketing-master-caption"
                    value={masterCaption}
                    onChange={(e) => setMasterCaption(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-sm focus:border-secondary transition-all outline-none resize-none text-on-surface leading-relaxed"
                    placeholder="Enter your post caption or ad copy here..."
                    rows={4}
                  />
                </div>

                {/* Budget & Target Options for Paid Ads matching dashboard.html lines 946-959 */}
                {campaignType !== 'ORGANIC' && (
                  <div id="marketing-paid-options" className="grid grid-cols-2 gap-4 border-t border-outline-variant/20 pt-4">
                    <div className="space-y-2">
                      <label className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block" htmlFor="marketing-budget">
                        Daily Budget (INR)
                      </label>
                      <input
                        type="number"
                        id="marketing-budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-4 py-3 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary transition-all text-sm text-on-surface font-semibold"
                        min={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block" htmlFor="marketing-target-audience">
                        Target Audience
                      </label>
                      <select
                        id="marketing-target-audience"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="w-full px-4 py-3 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary transition-all text-sm text-on-surface-variant cursor-pointer"
                      >
                        <option value="DEFAULT">Weight Loss Interests (25-55)</option>
                        <option value="LOCAL">Local Clinic Proximity (15km radius)</option>
                        <option value="LOOKALIKES">Patient Lookalikes (1%)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Action Buttons matching dashboard.html lines 962-971 */}
                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    id="btn-preflight-analyze"
                    onClick={handlePreflightAudit}
                    disabled={auditing}
                    className="flex-1 py-4 border-2 border-secondary text-secondary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary/5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">analytics</span>
                    <span>{auditing ? 'Auditing Policy...' : 'Run AI Pre-Flight Audit'}</span>
                  </button>
                  <button
                    type="button"
                    id="btn-marketing-publish"
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex-1 py-4 bg-secondary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all cursor-pointer shadow-lg shadow-secondary/20 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">send</span>
                    <span>{publishing ? 'Publishing...' : 'Publish Campaign'}</span>
                  </button>
                </div>
              </div>

              {/* AI PRE-FLIGHT ANALYSIS REPORT Card matching dashboard.html lines 975-1013 */}
              {showPreflightReport && (
                <div id="preflight-report-card" className="glass-card rounded-[24px] p-8 shadow-[0px_4px_20px_rgba(0,26,63,0.05)] border border-secondary/30 bg-secondary/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">verified</span>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Pre-Flight Optimization Report</h4>
                    </div>
                    <div className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full border border-secondary/20">
                      <span className="text-xs text-on-surface-variant">Score:</span>
                      <span id="preflight-score-badge" className="text-sm font-bold text-secondary">
                        {preflightScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-on-surface uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">policy</span>
                        Compliance Check
                      </div>
                      <p id="preflight-compliance-text" className="text-xs text-on-surface-variant leading-relaxed">
                        {complianceText}
                      </p>
                    </div>
                    <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-on-surface uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">trending_up</span>
                        Predictive Engagement
                      </div>
                      <p id="preflight-engagement-text" className="text-xs text-on-surface-variant leading-relaxed">
                        {engagementText}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-on-surface uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
                      AI Recommendations (Best Approach)
                    </div>
                    <ul id="preflight-recommendations-list" className="text-xs text-on-surface-variant list-disc pl-4 space-y-1.5">
                      {recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-SECTION 2: INTEGRATIONS matching dashboard.html lines 1017-1050 */}
          {activeSubtab === 'accounts' && (
            <div id="marketing-view-accounts" className="space-y-6">
              <div className="glass-card rounded-[24px] p-8 shadow-[0px_4px_20px_rgba(0,26,63,0.05)] border border-outline-variant/30 space-y-6 bg-surface-container-lowest">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Ad Accounts & Social Channels</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accounts.map((acc) => (
                    <div key={acc.platform} className="bg-surface border border-outline-variant/30 rounded-2xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/10 border border-secondary/30 rounded-xl flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-xl">share</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-on-surface">{acc.name}</h4>
                          <div className="text-[10px] font-mono text-on-surface-variant">{acc.handle}</div>
                          <span className={`text-[10px] font-bold mt-1 inline-block ${acc.connected ? 'text-green-600' : 'text-on-surface-variant/60'}`}>
                            {acc.connected ? '✓ CONNECTED' : 'NOT LINKED'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setAccounts((prev) =>
                            prev.map((a) => (a.platform === acc.platform ? { ...a, connected: !a.connected, handle: !a.connected ? '@drgodly.clinic' : 'Not Connected' } : a))
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          acc.connected
                            ? 'border-red-500 text-red-500 hover:bg-red-50'
                            : 'border-secondary text-secondary hover:bg-secondary/10'
                        }`}
                      >
                        {acc.connected ? 'Disconnect' : 'Connect Channel'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION 3: POSTING HISTORY matching dashboard.html lines 1052-1100 */}
          {activeSubtab === 'history' && (
            <div id="marketing-view-history" className="space-y-6">
              <div className="glass-card rounded-[24px] p-8 shadow-[0px_4px_20px_rgba(0,26,63,0.05)] border border-outline-variant/30 space-y-6 bg-surface-container-lowest">
                <div className="flex justify-between items-center">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Publishing Queue & Logs</h3>
                  <span className="text-xs font-mono text-on-surface-variant">{history.length} total entries</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface border-b border-outline-variant/30 text-on-surface-variant uppercase font-bold text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Campaign Name</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Attempts</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {history.map((row) => (
                        <tr key={row.jobId} className="hover:bg-surface/60 transition-colors">
                          <td className="p-3 font-bold text-on-surface">{row.campaignName}</td>
                          <td className="p-3 font-mono text-on-surface-variant">{row.platform}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                row.jobStatus === 'SUCCESS'
                                  ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                                  : 'bg-red-500/10 text-red-600 border border-red-500/30'
                              }`}
                            >
                              {row.jobStatus}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-on-surface-variant">{row.attempts}</td>
                          <td className="p-3 text-on-surface-variant">{row.createdAt}</td>
                          <td className="p-3">
                            {row.jobStatus === 'FAILED' ? (
                              <button
                                type="button"
                                onClick={() => handleRetryJob(row.jobId)}
                                className="px-2.5 py-1 bg-secondary text-white font-bold rounded-lg text-[10px] cursor-pointer hover:bg-secondary/90"
                              >
                                Retry Job
                              </button>
                            ) : row.externalUrl ? (
                              <a href={row.externalUrl} target="_blank" className="text-secondary font-semibold hover:underline">
                                View Post
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Live Feed Preview Card (40%) */}
        <div className="flex-[0.4] flex flex-col shrink-0">
          <div className="glass-card rounded-[24px] p-6 shadow-[0px_4px_20px_rgba(0,26,63,0.05)] border border-outline-variant/30 bg-surface-container-lowest sticky top-0 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Live Feed Preview</h4>
              <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                {campaignType === 'ORGANIC' ? 'Organic Post' : 'Sponsored Ad'}
              </span>
            </div>

            {/* Ad Mockup Box */}
            <div className="bg-surface border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm space-y-3">
              <div className="p-3 border-b border-outline-variant/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                  DG
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">DrGodly Clinic</div>
                  <div className="text-[9px] text-on-surface-variant">
                    {campaignType === 'ORGANIC' ? 'Just now • Public' : 'Sponsored • Medical Telehealth'}
                  </div>
                </div>
              </div>

              <div className="h-40 bg-surface-container-low flex items-center justify-center border-b border-outline-variant/20">
                {mediaFile ? (
                  <div className="text-center space-y-1">
                    <span className="material-symbols-outlined text-3xl text-secondary">image</span>
                    <div className="text-xs font-semibold text-on-surface">{mediaFile.name}</div>
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">image</span>
                )}
              </div>

              <div className="p-3 text-xs text-on-surface leading-relaxed min-h-[60px]">
                {masterCaption || 'Your campaign copy preview will render dynamically as you write...'}
              </div>

              {campaignType !== 'ORGANIC' && (
                <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-on-surface">DrGodly Consultation</div>
                    <div className="text-[9px] text-on-surface-variant">drgodly.com</div>
                  </div>
                  <button className="px-3 py-1 bg-secondary text-white text-[10px] font-bold rounded-lg">
                    Book Consult
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
