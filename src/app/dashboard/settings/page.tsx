'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [syncInterval, setSyncInterval] = useState('30');
  const [concurrency, setConcurrency] = useState('4');
  const [launchOnBoot, setLaunchOnBoot] = useState(true);
  const [checkUpdates, setCheckUpdates] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are an empathetic, professional intake assistant for DrGodly Weight Loss Telehealth Clinic. You evaluate patient eligibility for GLP-1 medications (Ozempic, Wegovy, Rybelsus, Mounjaro) based on BMI and medical risk factors.'
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Fetch settings from /api/bot/settings
  useEffect(() => {
    fetch('/api/bot/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setOpenaiKey(data.settings.openaiKey || '');
          setGeminiKey(data.settings.geminiKey || '');
          setSyncInterval(data.settings.syncInterval || '30');
          setConcurrency(data.settings.concurrency || '4');
          setLaunchOnBoot(data.settings.launchOnBoot ?? true);
          setCheckUpdates(data.settings.checkUpdates ?? true);
          setSystemPrompt(data.settings.systemPrompt || '');
        }
      })
      .catch((e) => console.error('Failed to load settings:', e));
  }, []);

  // Save Settings POST /api/bot/settings matching dashboard.ts line 1040
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/bot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openaiKey,
          geminiKey,
          syncInterval,
          concurrency,
          launchOnBoot,
          checkUpdates,
          systemPrompt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert(data.error || 'Failed to save preferences');
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset Session POST /api/bot/reset matching dashboard.ts line 1110
  const handleResetSession = async () => {
    if (!confirm('Are you sure you want to unpair and reset your WhatsApp session?')) {
      return;
    }

    setResetting(true);
    try {
      const res = await fetch('/api/bot/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('WhatsApp session cleared successfully! Please scan the QR code to re-pair.');
      } else {
        alert(data.error || 'Failed to reset session');
      }
    } catch (e) {
      console.error('Failed to reset session:', e);
      alert('Failed to reset session');
    } finally {
      setResetting(false);
    }
  };

  return (
    <main id="section-preferences" className="w-full p-10 max-w-5xl pb-24">
      <div className="grid grid-cols-12 gap-6">
        {/* Main Configuration Card matching dashboard.html lines 1165-1248 */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(0,26,63,0.05)] border border-outline-variant/30 overflow-hidden">
          {/* Header Banner matching line 1167 */}
          <div className="p-8 border-b border-outline-variant/30 bg-secondary text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <span className="material-symbols-outlined text-white text-2xl">api</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold">Credentials & Telemetry</h3>
                <p className="text-white/80 text-xs mt-0.5">Manage your AI keys and WhatsApp integration parameters</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <form id="settings-form" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* OpenAI Key Input matching lines 1181-1188 */}
              <div className="space-y-2">
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block font-bold" htmlFor="pref-openai-key">
                  OpenAI Key
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/60">key</span>
                  <input
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm font-mono text-on-surface"
                    id="pref-openai-key"
                    placeholder="sk-proj-..."
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant/60 italic">Used for GPT-4 based patient consultation summaries and intent processing.</p>
              </div>

              {/* Gemini Key Input matching lines 1190-1197 */}
              <div className="space-y-2">
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block font-bold" htmlFor="pref-gemini-key">
                  Gemini Key
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/60">token</span>
                  <input
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm font-mono text-on-surface"
                    id="pref-gemini-key"
                    placeholder="AIzaSy..."
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant/60 italic">Backup engine for secondary medical analysis tasks.</p>
              </div>

              {/* Sync Interval & Concurrency matching lines 1200-1221 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block font-bold" htmlFor="pref-interval">
                    Sync interval
                  </label>
                  <select
                    id="pref-interval"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(e.target.value)}
                    className="w-full py-3 px-4 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-on-surface-variant cursor-pointer font-semibold"
                  >
                    <option value="5">Every 5 minutes</option>
                    <option value="10">Every 10 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                    <option value="120">Every 2 hours</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block font-bold" htmlFor="pref-concurrency">
                    Concurrent fetches
                  </label>
                  <select
                    id="pref-concurrency"
                    value={concurrency}
                    onChange={(e) => setConcurrency(e.target.value)}
                    className="w-full py-3 px-4 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-sm text-on-surface-variant cursor-pointer font-semibold"
                  >
                    <option value="1">1 at a time</option>
                    <option value="2">2 at a time</option>
                    <option value="4">4 at a time</option>
                    <option value="8">8 at a time</option>
                  </select>
                </div>
              </div>

              {/* AI Telehealth Intake System Prompt */}
              <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider block font-bold" htmlFor="pref-system-prompt">
                  AI Intake Persona System Prompt
                </label>
                <textarea
                  id="pref-system-prompt"
                  rows={5}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full p-4 bg-surface border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none text-xs font-mono text-on-surface leading-relaxed resize-none"
                  placeholder="Enter system prompt for AI patient intake bot..."
                />
                <p className="text-[11px] text-on-surface-variant/60 italic">
                  Defines guardrails for patient BMI evaluation and physician review referral criteria.
                </p>
              </div>

              {/* Startup & Updates Checkboxes matching lines 1225-1233 */}
              <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/20">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id="pref-login"
                    type="checkbox"
                    checked={launchOnBoot}
                    onChange={(e) => setLaunchOnBoot(e.target.checked)}
                    className="rounded border-outline-variant/60 text-secondary focus:ring-secondary focus:ring-offset-0 focus:ring-1 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-on-surface">Launch DrGodly Bot when I log in</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id="pref-updates"
                    type="checkbox"
                    checked={checkUpdates}
                    onChange={(e) => setCheckUpdates(e.target.checked)}
                    className="rounded border-outline-variant/60 text-secondary focus:ring-secondary focus:ring-offset-0 focus:ring-1 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-on-surface">Check for updates daily</span>
                </label>
              </div>

              {/* Action Area matching lines 1236-1246 */}
              <div className="pt-6 flex items-center justify-between border-t border-outline-variant/30">
                <div className="flex items-center gap-2 text-on-surface-variant/70 font-label-md text-xs font-medium">
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                  <span>HIPAA Compliant Vault</span>
                </div>
                <button
                  id="btn-save-settings"
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-md hover:bg-secondary/90 cursor-pointer disabled:opacity-50 text-xs"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>{saved ? 'Preferences Saved!' : saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel: License & WhatsApp Session Reset Card */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* License Status Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,26,63,0.05)] space-y-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-3">
              <span className="material-symbols-outlined text-secondary">workspace_premium</span>
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">License Status</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-on-surface-variant/70 block text-[10px] uppercase font-bold">License Key:</span>
                <span className="font-mono font-bold text-secondary">LIC-DRGODLY-2026-PRO</span>
              </div>
              <div>
                <span className="text-on-surface-variant/70 block text-[10px] uppercase font-bold">Status:</span>
                <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  ACTIVE (Enterprise)
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant/70 block text-[10px] uppercase font-bold">Server Endpoint:</span>
                <span className="font-mono text-on-surface text-[11px]">https://license.drgodly.com</span>
              </div>
            </div>
          </div>

          {/* Session Reset Danger Zone */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 border border-error/20 shadow-[0px_4px_20px_rgba(0,26,63,0.05)] space-y-4">
            <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-3">
              <span className="material-symbols-outlined text-error">lock_reset</span>
              <h4 className="font-bold text-xs text-error uppercase tracking-wider">WhatsApp Session Controls</h4>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Unpair active WhatsApp Web sockets and clear cached session keys. You will need to scan the QR code to re-pair.
            </p>

            <button
              id="btn-reset-session"
              type="button"
              onClick={handleResetSession}
              disabled={resetting}
              className="w-full py-3 bg-error/10 hover:bg-error/20 text-error border border-error/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>{resetting ? 'Resetting Session...' : 'Unpair & Reset WhatsApp Session'}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
