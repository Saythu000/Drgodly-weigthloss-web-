'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
  url?: string;
  phoneNumber?: string;
  code?: string;
}

interface TemplateItem {
  templateId: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttons: TemplateButton[];
  samples?: Record<string, string>;
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState('+919390834107');
  const [testSending, setTestSending] = useState(false);

  // Form State matching ForgeChat exact fields
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [allowCategoryChange, setAllowCategoryChange] = useState(true);
  const [headerType, setHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  const [samples, setSamples] = useState<Record<string, string>>({});

  // Load existing templates from /api/bot/templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/bot/templates');
      const data = await res.json();
      if (data.success && data.templates) {
        setTemplates(data.templates);
      }
    } catch (e) {
      console.error('Failed to fetch templates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Format Text Helpers (Bold, Italic, Strikethrough)
  const formatBodyText = (prefix: string, suffix: string) => {
    setBodyText((prev) => `${prev}${prefix}text${suffix}`);
  };

  const insertVariable = () => {
    const varCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;
    const nextVar = varCount + 1;
    setBodyText((prev) => `${prev} {{${nextVar}}}`);
    setSamples((prev) => ({ ...prev, [nextVar.toString()]: `Sample_${nextVar}` }));
  };

  const addButton = (type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE') => {
    if (buttons.length >= 3) {
      alert('Maximum 3 interactive buttons allowed per template.');
      return;
    }
    if (type === 'QUICK_REPLY') {
      setButtons((prev) => [...prev, { type: 'QUICK_REPLY', text: 'Confirm Order' }]);
    } else if (type === 'URL') {
      setButtons((prev) => [...prev, { type: 'URL', text: 'Visit Website', url: 'https://drgodly.com' }]);
    } else if (type === 'PHONE_NUMBER') {
      setButtons((prev) => [...prev, { type: 'PHONE_NUMBER', text: 'Call Support', phoneNumber: '+919390834107' }]);
    } else {
      setButtons((prev) => [...prev, { type: 'COPY_CODE', text: 'Copy Offer Code', code: 'PROMO50' }]);
    }
  };

  const removeButton = (index: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation Checks
  const issues: string[] = [];
  if (!name.trim()) issues.push('Valid template name required');
  else if (!/^[a-z0-9_]+$/.test(name)) issues.push('Template name must be lowercase letters & underscores');
  if (!bodyText.trim()) issues.push('Body text filled');
  if (headerType === 'TEXT' && !headerText.trim()) issues.push('Header text filled');

  const isValid = issues.length === 0;

  // Resolve body preview with sample variables
  let resolvedBody = bodyText;
  Object.keys(samples).forEach((v) => {
    resolvedBody = resolvedBody.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), samples[v] || `{{${v}}}`);
  });

  // Generated Meta API JSON Payload
  const apiPayload = {
    name: name || 'example_template_name',
    category,
    language,
    allow_category_change: allowCategoryChange,
    components: [
      ...(headerType !== 'NONE'
        ? [
            {
              type: 'HEADER',
              format: headerType,
              ...(headerType === 'TEXT' ? { text: headerText } : {}),
            },
          ]
        : []),
      {
        type: 'BODY',
        text: bodyText,
        ...(Object.keys(samples).length > 0
          ? { example: { body_text: [Object.values(samples)] } }
          : {}),
      },
      ...(footerText ? [{ type: 'FOOTER', text: footerText }] : []),
      ...(buttons.length > 0
        ? [
            {
              type: 'BUTTONS',
              buttons: buttons.map((b) => {
                if (b.type === 'URL') return { type: 'URL', text: b.text, url: b.url };
                if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phoneNumber };
                if (b.type === 'COPY_CODE') return { type: 'COPY_CODE', example: [b.code] };
                return { type: 'QUICK_REPLY', text: b.text };
              }),
            },
          ]
        : []),
    ],
  };

  // Create & Submit Template
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/bot/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          language,
          allowCategoryChange,
          headerType,
          headerText,
          bodyText,
          footerText,
          buttons,
          samples,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Template created and submitted to Meta!');
        setName('');
        setBodyText('');
        setFooterText('');
        setHeaderText('');
        setButtons([]);
        fetchTemplates();
      } else {
        alert(data.error || 'Failed to submit template');
      }
    } catch (err) {
      console.error('Failed to submit template:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Duplicate Template
  const handleDuplicate = async (templateId: string) => {
    try {
      const res = await fetch('/api/bot/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', templateId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (e) {
      console.error('Failed to duplicate template:', e);
    }
  };

  // Delete Template
  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await fetch('/api/bot/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', templateId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
      }
    } catch (e) {
      console.error('Failed to delete template:', e);
    }
  };

  // Test-send Live Template to Phone
  const handleTestSend = async () => {
    if (!testPhone.trim() || !bodyText.trim()) {
      alert('Please fill body text and recipient phone number');
      return;
    }
    setTestSending(true);
    try {
      const res = await fetch('/api/bot/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-send',
          to: testPhone,
          headerType,
          headerText,
          bodyText,
          footerText,
          buttons,
          samples,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Test template message dispatched to ${testPhone}!`);
        setShowTestModal(false);
      } else {
        alert(data.error || 'Failed to send test template');
      }
    } catch (e) {
      console.error('Failed to send test template:', e);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <main id="section-templates" className="flex-1 overflow-y-auto p-8 flex flex-col bg-surface min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/20 shrink-0">
        <div>
          <h1 className="font-headline-sm text-2xl font-bold text-on-surface tracking-tight">
            Message Template Builder
          </h1>
          <p className="text-xs text-on-surface-variant/70 mt-1">
            Fill all required fields to submit for Meta approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-bold rounded-xl hover:border-secondary transition-all"
          >
            ← Back
          </Link>

          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold rounded-full">
            • DRAFT
          </span>

          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="px-5 py-2.5 bg-secondary text-white font-bold text-xs rounded-xl shadow-md hover:bg-secondary/90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Submitting to Meta...' : 'Submit for Approval'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout (Left Form / Right Live Preview) */}
      <div className="flex-1 flex gap-8 items-start">
        {/* Left Column (60% Form) */}
        <div className="flex-[0.6] space-y-6 pb-12">
          {/* 1. BASIC INFORMATION */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-error text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">
                Basic Information
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Template Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. order_confirmation"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary text-xs font-mono text-on-surface"
                  />
                  <p className="text-[10px] text-on-surface-variant">
                    Lowercase, underscores only · Max 512 chars
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Language *</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary text-xs text-on-surface font-medium cursor-pointer"
                  >
                    <option value="en_US">English (en_US)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="es">Spanish (es)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CATEGORY */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-error text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">
                Category
              </h3>
            </div>

            {/* 3 Interactive Cards */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* Marketing Card */}
              <div
                onClick={() => setCategory('MARKETING')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  category === 'MARKETING'
                    ? 'border-error bg-error/5 shadow-md'
                    : 'border-outline-variant/30 hover:border-error/50 bg-surface'
                }`}
              >
                <span className="material-symbols-outlined text-2xl text-error mb-2 block">
                  campaign
                </span>
                <h4 className="font-bold text-xs text-on-surface">Marketing</h4>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Promotions, offers, announcements
                </p>
              </div>

              {/* Utility Card */}
              <div
                onClick={() => setCategory('UTILITY')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  category === 'UTILITY'
                    ? 'border-error bg-error/5 shadow-md'
                    : 'border-outline-variant/30 hover:border-error/50 bg-surface'
                }`}
              >
                <span className="material-symbols-outlined text-2xl text-secondary mb-2 block">
                  notifications
                </span>
                <h4 className="font-bold text-xs text-on-surface">Utility</h4>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Order updates, delivery alerts
                </p>
              </div>

              {/* Authentication Card */}
              <div
                onClick={() => setCategory('AUTHENTICATION')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  category === 'AUTHENTICATION'
                    ? 'border-error bg-error/5 shadow-md'
                    : 'border-outline-variant/30 hover:border-error/50 bg-surface'
                }`}
              >
                <span className="material-symbols-outlined text-2xl text-amber-600 mb-2 block">
                  verified_user
                </span>
                <h4 className="font-bold text-xs text-on-surface">Authentication</h4>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  OTPs, verification codes
                </p>
              </div>
            </div>

            {/* Auto-correct Toggle Switch */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                  Allow Meta to auto-correct category
                </span>
                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                  Prevents rejection if Meta disagrees — they'll fix it instead
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowCategoryChange}
                onChange={(e) => setAllowCategoryChange(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. HEADER (optional) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-error text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">
                Header <span className="text-on-surface-variant/60 font-normal lowercase">(optional)</span>
              </h3>
            </div>

            {/* Header Type Pill Selectors */}
            <div className="flex gap-2 pt-2">
              {(
                [
                  { id: 'NONE', label: '✕ None' },
                  { id: 'TEXT', label: 'T Text' },
                  { id: 'IMAGE', label: '🖼️ Image' },
                  { id: 'VIDEO', label: '🎥 Video' },
                  { id: 'DOCUMENT', label: '📄 Document' },
                ] as const
              ).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHeaderType(h.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    headerType === h.id
                      ? 'border-secondary text-secondary bg-secondary/10'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-secondary/50'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            {headerType === 'TEXT' && (
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="e.g. DrGodly Telehealth"
                className="w-full px-4 py-2.5 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary text-xs text-on-surface"
              />
            )}
          </div>

          {/* 4. BODY (MESSAGE CONTENT) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-error text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">
                  Body (Message Content)
                </h3>
              </div>

              {/* Add Variable Button */}
              <button
                type="button"
                onClick={insertVariable}
                className="px-3 py-1.5 border border-error text-error bg-error/5 text-xs font-bold rounded-xl hover:bg-error/10 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{`{ }`} Add Variable</span>
              </button>
            </div>

            {/* Rich Formatting Toolbar */}
            <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl border border-outline-variant/20">
              <button
                type="button"
                onClick={() => formatBodyText('*', '*')}
                className="w-7 h-7 font-bold text-xs hover:bg-surface rounded text-on-surface"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => formatBodyText('_', '_')}
                className="w-7 h-7 italic text-xs hover:bg-surface rounded text-on-surface"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => formatBodyText('~', '~')}
                className="w-7 h-7 line-through text-xs hover:bg-surface rounded text-on-surface"
                title="Strikethrough"
              >
                S
              </button>
            </div>

            <textarea
              rows={5}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Hello {{1}}, your GLP-1 weight loss intake has been reviewed by Dr. Kalyan..."
              className="w-full p-4 bg-surface border border-outline-variant/30 rounded-xl focus:border-secondary transition-all outline-none text-xs text-on-surface leading-relaxed resize-none"
            />

            <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
              <span>*bold* _italic_ ~strikethrough~ {`{{1}}`} variables</span>
              <span className="font-mono">{bodyText.length}/1024</span>
            </div>

            {/* Sample Variable Fallbacks Inputs */}
            {Object.keys(samples).length > 0 && (
              <div className="p-3 bg-surface border border-outline-variant/30 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-on-surface uppercase block">
                  Sample Replacement Values (for Preview):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(samples).map((v) => (
                    <div key={v} className="flex items-center gap-1 text-xs">
                      <span className="font-mono font-bold text-secondary">{`{{${v}}}`}:</span>
                      <input
                        type="text"
                        value={samples[v]}
                        onChange={(e) => setSamples({ ...samples, [v]: e.target.value })}
                        className="flex-1 px-2 py-1 bg-surface-container-high border rounded text-xs outline-none text-on-surface"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. FOOTER (optional) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-error text-white font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">
                Footer <span className="text-on-surface-variant/60 font-normal lowercase">(optional)</span>
              </h3>
            </div>

            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g. Reply STOP to unsubscribe"
              className="w-full px-4 py-2.5 bg-surface border border-outline-variant/30 rounded-xl outline-none focus:border-secondary text-xs text-on-surface"
            />
            <div className="text-[10px] text-on-surface-variant">
              Small grey text · No variables allowed · {footerText.length}/60
            </div>
          </div>

          {/* 6. BUTTONS (optional) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-error text-white font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">
                  Buttons <span className="text-on-surface-variant/60 font-normal lowercase">(optional)</span>
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addButton('QUICK_REPLY')}
                  className="px-2 py-1 bg-surface border border-outline-variant/30 text-on-surface text-[10px] font-bold rounded-lg hover:border-secondary cursor-pointer"
                >
                  + Quick Reply
                </button>
                <button
                  type="button"
                  onClick={() => addButton('URL')}
                  className="px-2 py-1 bg-surface border border-outline-variant/30 text-on-surface text-[10px] font-bold rounded-lg hover:border-secondary cursor-pointer"
                >
                  + Visit URL
                </button>
                <button
                  type="button"
                  onClick={() => addButton('PHONE_NUMBER')}
                  className="px-2 py-1 bg-surface border border-outline-variant/30 text-on-surface text-[10px] font-bold rounded-lg hover:border-secondary cursor-pointer"
                >
                  + Call Phone
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {buttons.map((btn, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-[10px] font-bold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                    {btn.type}
                  </span>
                  <input
                    type="text"
                    value={btn.text}
                    onChange={(e) =>
                      setButtons((prev) =>
                        prev.map((b, i) => (i === index ? { ...b, text: e.target.value } : b))
                      )
                    }
                    placeholder="Button label..."
                    className="flex-1 px-3 py-1 bg-surface-container-high border border-outline-variant/20 rounded-lg text-xs text-on-surface outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeButton(index)}
                    className="p-1 text-error hover:bg-error/10 rounded"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex gap-4 items-center pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="flex-1 py-3.5 bg-secondary text-white font-bold text-xs rounded-xl shadow-lg hover:bg-secondary/90 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>{submitting ? 'Submitting to Meta...' : 'Submit for Approval'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPayloadModal(true)}
              className="px-4 py-3.5 bg-surface-container border border-outline-variant/30 text-on-surface font-bold text-xs rounded-xl hover:border-secondary transition-all cursor-pointer"
            >
              View API Payload
            </button>

            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="px-4 py-3.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">phonelink_ring</span>
              <span>Test Send</span>
            </button>
          </div>
        </div>

        {/* Right Column (40% Authentic WhatsApp iPhone Preview & Spec Summary) */}
        <div className="flex-[0.4] space-y-6 sticky top-6">
          {/* Realistic iPhone 15 Frame */}
          <div className="w-[310px] mx-auto bg-black rounded-[46px] p-3 shadow-2xl border-4 border-zinc-700 relative">
            {/* Dynamic Island Notch */}
            <div className="w-24 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center gap-2 border border-zinc-800">
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
              <div className="w-2 h-2 bg-blue-900/50 rounded-full" />
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-[#efeae2] dark:bg-zinc-900 rounded-[36px] overflow-hidden min-h-[420px] flex flex-col justify-between border border-zinc-800">
              {/* WhatsApp Top Header Bar */}
              <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-base leading-none">‹</span>
                  <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                    YB
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight">Your Business</h4>
                    <span className="text-[9px] opacity-80 block">online</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-90">
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  <span className="material-symbols-outlined text-sm">call</span>
                </div>
              </div>

              {/* Phone Chat Body */}
              <div className="p-3 flex-1 flex flex-col justify-end">
                {/* Date Badge */}
                <div className="text-center mb-3">
                  <span className="bg-[#e1f2fa] text-[#3c6678] text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                    TODAY
                  </span>
                </div>

                {/* Authentic WhatsApp Template Message Card */}
                <div className="ml-auto max-w-[92%] min-w-[60%]">
                  {/* Top Message Bubble */}
                  <div
                    className={`bg-[#dcf8c6] dark:bg-[#1f2c34] p-3 text-xs leading-relaxed space-y-1.5 shadow-sm border border-black/5 ${
                      buttons.length > 0 ? 'rounded-t-xl rounded-bl-xl' : 'rounded-2xl rounded-tr-none'
                    }`}
                  >
                    {/* Header Asset */}
                    {headerType === 'TEXT' && headerText && (
                      <div className="font-bold text-on-surface text-[12px] border-b border-black/5 pb-1">
                        {headerText}
                      </div>
                    )}
                    {headerType === 'IMAGE' && (
                      <div className="h-28 bg-emerald-700/10 rounded-lg flex items-center justify-center border border-emerald-700/20 text-emerald-700 mb-1">
                        <span className="material-symbols-outlined text-3xl">image</span>
                      </div>
                    )}

                    {/* Body Copy */}
                    <div className="text-on-surface whitespace-pre-wrap text-[12px] leading-snug">
                      {resolvedBody || 'Your message content will appear here...'}
                    </div>

                    {/* Footer Copy */}
                    {footerText && (
                      <div className="text-[10px] text-on-surface-variant/70 italic border-t border-black/5 pt-1">
                        {footerText}
                      </div>
                    )}

                    <div className="text-[9px] text-right opacity-60 font-mono flex items-center justify-end gap-1 pt-1">
                      <span>04:59 PM</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>

                  {/* Authentic Attached WhatsApp Buttons Card */}
                  {buttons.length > 0 && (
                    <div className="bg-white dark:bg-zinc-800 rounded-b-xl overflow-hidden shadow-sm border-x border-b border-black/5">
                      {buttons.map((b, i) => (
                        <div
                          key={i}
                          className="py-2 px-3 text-center text-xs font-semibold text-[#00a884] dark:text-emerald-400 flex items-center justify-center gap-1.5 border-t border-black/10 hover:bg-black/5 transition-all cursor-pointer"
                        >
                          {b.type === 'URL' && <span className="material-symbols-outlined text-sm">open_in_new</span>}
                          {b.type === 'PHONE_NUMBER' && <span className="material-symbols-outlined text-sm">call</span>}
                          {b.type === 'COPY_CODE' && <span className="material-symbols-outlined text-sm">content_copy</span>}
                          {b.type === 'QUICK_REPLY' && <span className="material-symbols-outlined text-sm">reply</span>}
                          <span>{b.text || 'Button'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Message Input Bar */}
              <div className="p-2 bg-surface-container-high border-t border-outline-variant/20 flex items-center gap-2">
                <div className="flex-1 bg-surface px-3 py-1 rounded-full text-[10px] text-on-surface-variant">
                  Message
                </div>
                <div className="w-6 h-6 rounded-full bg-[#25d366] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  ➔
                </div>
              </div>
            </div>
          </div>

          {/* SUBMISSION CHECKLIST */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">
                Submission Checklist
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isValid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-error/10 text-error'}`}>
                {isValid ? '✅ Ready' : `${issues.length} Issues`}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${name.trim() ? 'text-emerald-500' : 'text-error'}`}>
                  {name.trim() ? 'check_circle' : 'cancel'}
                </span>
                <span className={name.trim() ? 'text-on-surface' : 'text-error'}>Valid template name</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-sm ${bodyText.trim() ? 'text-emerald-500' : 'text-error'}`}>
                  {bodyText.trim() ? 'check_circle' : 'cancel'}
                </span>
                <span className={bodyText.trim() ? 'text-on-surface' : 'text-error'}>Body text filled</span>
              </div>
            </div>
          </div>

          {/* TEMPLATE SPEC SUMMARY */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">
              Template Spec
            </h4>
            <div className="space-y-2 divide-y divide-outline-variant/20">
              <div className="flex justify-between pt-1">
                <span className="text-on-surface-variant font-medium">NAME</span>
                <span className="font-mono font-bold text-on-surface">{name || '—'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-on-surface-variant font-medium">CATEGORY</span>
                <span className="font-bold text-secondary">{category}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-on-surface-variant font-medium">LANGUAGE</span>
                <span className="font-bold text-on-surface">{language}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-on-surface-variant font-medium">HEADER</span>
                <span className="font-bold text-on-surface">{headerType}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-on-surface-variant font-medium">VARIABLES</span>
                <span className="font-mono font-bold text-on-surface">{Object.keys(samples).length > 0 ? Object.keys(samples).join(', ') : 'NONE'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-on-surface-variant font-medium">BUTTONS</span>
                <span className="font-bold text-on-surface">{buttons.length > 0 ? `${buttons.length} Buttons` : 'NONE'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-on-surface-variant font-medium">STATUS</span>
                <span className="font-bold text-amber-600">DRAFT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Approved Templates Table */}
      <div className="mt-12 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-on-surface">Registered WhatsApp Templates ({templates.length})</h3>
          <span className="text-xs text-on-surface-variant">Live Meta Synced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-on-surface-variant uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Template Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Header</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {templates.map((t) => (
                <tr key={t.templateId} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-on-surface">{t.name}</td>
                  <td className="p-3 font-semibold text-secondary">{t.category}</td>
                  <td className="p-3 font-semibold">{t.headerType}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(t.templateId)}
                      className="px-2.5 py-1 bg-surface border border-outline-variant/30 text-on-surface rounded-lg font-semibold hover:border-secondary cursor-pointer"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(t.templateId)}
                      className="p-1 text-error hover:bg-error/10 rounded cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View API Payload Modal */}
      {showPayloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-sm text-on-surface">Meta Graph API JSON Payload</h3>
              <button onClick={() => setShowPayloadModal(false)} className="text-on-surface-variant hover:text-on-surface">
                ✕
              </button>
            </div>
            <pre className="p-4 bg-zinc-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-96">
              {JSON.stringify(apiPayload, null, 2)}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPayloadModal(false)}
                className="px-4 py-2 bg-secondary text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Send Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="font-bold text-sm text-on-surface">Test-Send Live Template</h3>
              <button onClick={() => setShowTestModal(false)} className="text-on-surface-variant hover:text-on-surface">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="font-bold text-on-surface block">Recipient Phone Number</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+919390834107"
                className="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl outline-none font-mono text-on-surface"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowTestModal(false)} className="px-4 py-2 bg-surface-container text-xs font-semibold rounded-xl cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleTestSend}
                disabled={testSending}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {testSending ? 'Sending...' : 'Send Live Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
