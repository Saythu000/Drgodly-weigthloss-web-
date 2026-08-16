'use client';

import React, { useState, useEffect } from 'react';

interface KnowledgeItem {
  id: string;
  title: string;
  category: 'FAQ' | 'MEDICAL_PROTOCOL' | 'PRICING_POLICY' | 'CLINIC_INFO';
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgentConfig {
  systemPrompt: string;
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  strictSchemaMode: boolean;
  minConfidenceThreshold: number;
  autoHumanEscalation: boolean;
  medicalDisclaimer: string;
  tools: {
    search_knowledge_base: boolean;
    check_appointment_slots: boolean;
    generate_razorpay_link: boolean;
    start_patient_intake: boolean;
    start_doctor_onboarding: boolean;
    start_partnership_flow: boolean;
  };
}

interface KnowledgeDocument {
  id: string;
  filename: string;
  fileType: string;
  fileSize: string;
  category: 'FAQ' | 'MEDICAL_PROTOCOL' | 'PRICING_POLICY' | 'CLINIC_INFO';
  chunkCount: number;
  status: 'INDEXED' | 'PROCESSING' | 'ERROR';
  createdAt: string;
  updatedAt: string;
}

// ponytail: minimum clean implementation matching site design system
export default function AiAgentAdminPage() {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'persona' | 'tools' | 'guardrails' | 'sandbox'>('knowledge');

  // Config State
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Knowledge Base Snippets State
  const [kbItems, setKbItems] = useState<KnowledgeItem[]>([]);
  const [loadingKb, setLoadingKb] = useState(true);

  // Knowledge Documents Vault State
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<KnowledgeDocument['category']>('FAQ');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState(false);
  const [kbMode, setKbMode] = useState<'vault' | 'snippets'>('vault');

  // New Knowledge Item Modal State
  const [showAddKbModal, setShowAddKbModal] = useState(false);
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbCategory, setNewKbCategory] = useState<KnowledgeItem['category']>('FAQ');
  const [newKbContent, setNewKbContent] = useState('');
  const [addingKb, setAddingKb] = useState(false);

  // Sandbox Playground State
  const [sandboxQuery, setSandboxQuery] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // Fetch initial config, knowledge items & documents
  useEffect(() => {
    fetchConfig();
    fetchKnowledge();
    fetchDocuments();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/ai-agent/config');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (e) {
      console.error('Failed to fetch config', e);
    }
  };

  const fetchKnowledge = async () => {
    setLoadingKb(true);
    try {
      const res = await fetch('/api/admin/ai-agent/knowledge');
      const data = await res.json();
      if (data.success) {
        setKbItems(data.items);
      }
    } catch (e) {
      console.error('Failed to fetch knowledge base', e);
    } finally {
      setLoadingKb(false);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/admin/ai-agent/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (e) {
      console.error('Failed to fetch documents', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDoc(true);
    setConfigMsg(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadCategory);

        const res = await fetch('/api/admin/ai-agent/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          setDocuments((prev) => [data.document, ...prev]);
          setConfigMsg({ type: 'success', text: data.message || `Uploaded and chunked ${file.name}` });
          fetchKnowledge(); // refresh snippets too
        } else {
          setConfigMsg({ type: 'error', text: data.error || `Failed to process ${file.name}` });
        }
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'File upload error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;

    setScrapingUrl(true);
    setConfigMsg(null);

    try {
      const res = await fetch('/api/admin/ai-agent/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl, category: uploadCategory }),
      });

      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => [data.document, ...prev]);
        setConfigMsg({ type: 'success', text: `Web page scraped and ingested into RAG!` });
        setScrapeUrl('');
        fetchKnowledge();
      } else {
        setConfigMsg({ type: 'error', text: data.error || 'Failed to scrape URL' });
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'Scrape error' });
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleDeleteDocument = async (id: string, filename: string) => {
    if (!confirm(`Delete "${filename}" and remove all its vector chunks from RAG Knowledge Base?`)) return;
    try {
      const res = await fetch(`/api/admin/ai-agent/documents?id=${id}&filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(documents.filter((d) => d.id !== id));
        fetchKnowledge();
      }
    } catch (e) {
      console.error('Failed to delete document', e);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config) return;

    setSavingConfig(true);
    setConfigMsg(null);
    try {
      const res = await fetch('/api/admin/ai-agent/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setConfigMsg({ type: 'success', text: 'AI Agent Configuration saved successfully!' });
      } else {
        setConfigMsg({ type: 'error', text: data.error || 'Failed to save config' });
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'Save error' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteKbItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge snippet?')) return;
    try {
      const res = await fetch(`/api/admin/ai-agent/knowledge?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKbItems(kbItems.filter((k) => k.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete knowledge item', e);
    }
  };

  const handleAddKbItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle.trim() || !newKbContent.trim()) return;

    setAddingKb(true);
    try {
      const res = await fetch('/api/admin/ai-agent/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newKbTitle,
          category: newKbCategory,
          content: newKbContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setKbItems([data.item, ...kbItems]);
        setShowAddKbModal(false);
        setNewKbTitle('');
        setNewKbContent('');
      }
    } catch (e) {
      console.error('Failed to add knowledge item', e);
    } finally {
      setAddingKb(false);
    }
  };

  const handleRunSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxQuery.trim()) return;

    setSandboxLoading(true);
    setSandboxResult(null);
    try {
      const res = await fetch('/api/admin/ai-agent/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sandboxQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setSandboxResult(data.result);
      }
    } catch (e) {
      console.error('Sandbox error', e);
    } finally {
      setSandboxLoading(false);
    }
  };


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-extrabold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-sm">smart_toy</span>
            AI Agent & RAG Control Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-headline-sm">DrGodly AI Agent Configuration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Multi-Format Document RAG Ingestion (PDF, Excel, CSV, DOCX), dual-LLM models, tool execution policies, and test live prompts.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex gap-1.5 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'knowledge' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-base">folder_open</span>
          <span>1. Knowledge Base Vault ({documents.length} Docs / {kbItems.length} Chunks)</span>
        </button>

        <button
          onClick={() => setActiveTab('persona')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'persona' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-base">psychology</span>
          <span>2. Persona & LLM Models</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'tools' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-base">build</span>
          <span>3. Tools & Actions</span>
        </button>

        <button
          onClick={() => setActiveTab('guardrails')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'guardrails' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-base">verified_user</span>
          <span>4. Guardrails & Safety</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'sandbox' ? 'bg-white text-teal-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="material-symbols-outlined text-base">science</span>
          <span>5. Live Playground</span>
        </button>
      </div>

      {/* Global Config Message */}
      {configMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
            configMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{configMsg.text}</span>
          <button onClick={() => setConfigMsg(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {/* TAB 1: KNOWLEDGE BASE VAULT & INGESTION PIPELINE */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Toggle View Mode Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 card-shadow">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setKbMode('vault')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  kbMode === 'vault' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">upload_file</span>
                <span>Document Files Ingestion Vault ({documents.length})</span>
              </button>
              <button
                onClick={() => setKbMode('snippets')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  kbMode === 'snippets' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">segment</span>
                <span>RAG Text Chunks & FAQs ({kbItems.length})</span>
              </button>
            </div>

            {kbMode === 'snippets' && (
              <button
                onClick={() => setShowAddKbModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Add Quick FAQ Snippet</span>
              </button>
            )}
          </div>

          {/* VIEW MODE 1: ENTERPRISE DOCUMENT VAULT */}
          {kbMode === 'vault' && (
            <div className="space-y-6">
              {/* Drag & Drop Upload Zone & Web Link Scraper */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Drag & Drop Card */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-600">cloud_upload</span>
                        Upload Company Files (PDF, Excel, CSV, Word, TXT)
                      </h2>
                      <p className="text-[11px] text-slate-500">Auto-extracted, cut into 700-character chunks & indexed into RAG memory.</p>
                    </div>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold"
                    >
                      <option value="FAQ">FAQ</option>
                      <option value="MEDICAL_PROTOCOL">MEDICAL_PROTOCOL</option>
                      <option value="PRICING_POLICY">PRICING_POLICY</option>
                      <option value="CLINIC_INFO">CLINIC_INFO</option>
                    </select>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/40 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group">
                    <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-teal-600 mb-2 transition-all">
                      post_add
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {uploadingDoc ? 'Processing & Chunking Document...' : 'Click to Upload or Drag & Drop Documents'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Supports PDF, XLSX, CSV, DOCX, TXT, JSON (Max 25MB)</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.csv,.xlsx,.xls,.txt,.md,.docx,.json"
                      onChange={handleFileUpload}
                      disabled={uploadingDoc}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Web Link Scraper Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4 flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-600">language</span>
                      Web Page URL Scraper
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">Paste any clinic website landing page to scrape & index automatically.</p>
                  </div>

                  <form onSubmit={handleScrapeUrl} className="space-y-3">
                    <input
                      type="url"
                      placeholder="https://drgodly.com/pricing"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-teal-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={scrapingUrl}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">travel_explore</span>
                      <span>{scrapingUrl ? 'Scraping Page...' : 'Scrape & Ingest URL'}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Uploaded Documents Inventory Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Ingested Company Document Vault</h2>
                    <p className="text-xs text-slate-500">Active company files powering the AI Agent search & recommendation engine.</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                    {documents.length} File Records
                  </span>
                </div>

                {loadingDocs ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading document vault...</div>
                ) : documents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    No documents uploaded yet. Drag & Drop a PDF, Excel sheet, or CSV above!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <div key={doc.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-3 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold shrink-0">
                            <span className="material-symbols-outlined text-lg">
                              {doc.fileType === 'PDF' ? 'picture_as_pdf' : doc.fileType.includes('CSV') ? 'table_chart' : 'description'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900">{doc.filename}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                                {doc.fileType}
                              </span>
                              <span>Size: {doc.fileSize}</span>
                              <span>•</span>
                              <span>Chunks: {doc.chunkCount}</span>
                              <span>•</span>
                              <span>Category: {doc.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            INDEXED (RAG READY)
                          </span>
                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                            title="Delete document and remove all vector chunks"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: RAW TEXT CHUNKS & FAQS */}
          {kbMode === 'snippets' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Extracted RAG Text Chunks ({kbItems.length})</h2>
                  <p className="text-xs text-slate-500">Individual text blocks indexed in vector memory for retrieval.</p>
                </div>
              </div>

              {loadingKb ? (
                <div className="p-12 text-center text-xs text-slate-500">Loading Knowledge Base dataset...</div>
              ) : kbItems.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  No Knowledge Base items added yet. Click "Add Knowledge Entry" to create one!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kbItems.map((item) => (
                    <div key={item.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative group hover:border-teal-400 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800">
                            {item.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-1.5">{item.title}</h3>
                        </div>
                        <button
                          onClick={() => handleDeleteKbItem(item.id)}
                          title="Delete Entry"
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-3 bg-white p-3.5 rounded-xl border border-slate-200/80 font-mono">
                        {item.content}
                      </p>
                      <div className="text-[10px] text-slate-400 flex justify-between pt-1 font-medium">
                        <span>ID: {item.id}</span>
                        <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERSONA & LLM CONFIGURATOR */}
      {activeTab === 'persona' && config && (
        <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">System Persona Prompt</h2>
            <p className="text-xs text-slate-500 mb-3">Defines the identity, voice, and behavioral constraints of the Virtual Assistant.</p>
            <textarea
              rows={5}
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Primary AI Model (Structured Outputs)</label>
              <select
                value={config.primaryModel}
                onChange={(e) => setConfig({ ...config, primaryModel: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="gpt-4o-mini">OpenAI gpt-4o-mini (Recommended)</option>
                <option value="gpt-4o">OpenAI gpt-4o (High Reasoning)</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Fallback AI Model (Failover Uptime)</label>
              <select
                value={config.fallbackModel}
                onChange={(e) => setConfig({ ...config, fallbackModel: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:bg-white focus:outline-none focus:border-teal-500"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Recommended)</option>
                <option value="gpt-4o-mini">OpenAI gpt-4o-mini</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Temperature Sampling ({config.temperature})</label>
                <span className="text-[10px] text-teal-700 font-bold">0.1 = Strict Grounding</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Strict JSON Schema Mode</span>
                <span className="text-[10px] text-slate-500">Enforces token sampling against Zod/JSON-Schema</span>
              </div>
              <input
                type="checkbox"
                checked={config.strictSchemaMode}
                onChange={(e) => setConfig({ ...config, strictSchemaMode: e.target.checked })}
                className="w-5 h-5 accent-teal-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{savingConfig ? 'Saving...' : 'Save Model Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: TOOLS & ACTION GOVERNANCE */}
      {activeTab === 'tools' && config && (
        <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tool & Action Governance</h2>
            <p className="text-xs text-slate-500 mb-4">Control which tools the ReAct AI Agent is authorized to call during conversation loops.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'search_knowledge_base', label: 'search_knowledge_base', desc: 'Allows RAG vector search across clinic knowledge base' },
              { key: 'check_appointment_slots', label: 'check_appointment_slots', desc: 'Queries available consultation slots with Dr. Kalyan' },
              { key: 'generate_razorpay_link', label: 'generate_razorpay_link', desc: 'Generates Razorpay payment link for consultation fee' },
              { key: 'start_patient_intake', label: 'start_patient_intake', desc: 'Triggers 20-step medical weight loss intake wizard' },
              { key: 'start_doctor_onboarding', label: 'start_doctor_onboarding', desc: 'Triggers 3-step Doctor Recruitment questionnaire' },
              { key: 'start_partnership_flow', label: 'start_partnership_flow', desc: 'Triggers 2-step B2B clinic partnership proposal flow' },
            ].map((tool) => (
              <div key={tool.key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-white hover:shadow-sm transition-all">
                <div>
                  <span className="text-xs font-bold text-teal-700 font-mono block">{tool.label}</span>
                  <span className="text-[10px] text-slate-500">{tool.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={(config.tools as any)[tool.key]}
                  onChange={(e) => setConfig({ ...config, tools: { ...config.tools, [tool.key]: e.target.checked } })}
                  className="w-5 h-5 accent-teal-600 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{savingConfig ? 'Saving...' : 'Save Tool Governance Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: GUARDRAILS & SAFETY */}
      {activeTab === 'guardrails' && config && (
        <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Guardrails & Safety Configuration</h2>
            <p className="text-xs text-slate-500 mb-4">Set confidence thresholds, medical disclaimers, and automated human escalation rules.</p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Minimum Confidence Threshold ({config.minConfidenceThreshold})</label>
                <span className="text-[10px] text-amber-700 font-bold">Below this threshold = Escalate to Human</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={config.minConfidenceThreshold}
                onChange={(e) => setConfig({ ...config, minConfidenceThreshold: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Auto Human Escalation</span>
                <span className="text-[10px] text-slate-500">Seamlessly route low-confidence or complex queries to human staff inbox</span>
              </div>
              <input
                type="checkbox"
                checked={config.autoHumanEscalation}
                onChange={(e) => setConfig({ ...config, autoHumanEscalation: e.target.checked })}
                className="w-5 h-5 accent-teal-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Mandatory Medical Disclaimer Text</label>
              <textarea
                rows={3}
                value={config.medicalDisclaimer}
                onChange={(e) => setConfig({ ...config, medicalDisclaimer: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{savingConfig ? 'Saving...' : 'Save Guardrail Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: LIVE PLAYGROUND SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 card-shadow space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live AI Playground Sandbox</h2>
            <p className="text-xs text-slate-500 mb-4">Test incoming patient messages live against the classifier & Knowledge Base.</p>
          </div>

          <form onSubmit={handleRunSandbox} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. What is the fee for GLP-1 weight loss consultation?"
              value={sandboxQuery}
              onChange={(e) => setSandboxQuery(e.target.value)}
              className="flex-1 p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={sandboxLoading}
              className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              <span>{sandboxLoading ? 'Testing...' : 'Run Test Prompt'}</span>
            </button>
          </form>

          {sandboxResult && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-teal-200 space-y-4 font-mono text-xs text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    Category: {sandboxResult.category}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Confidence: {(sandboxResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">Latency: {sandboxResult.latencyMs} ms</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1 font-sans font-bold">Reasoning:</span>
                <p className="text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200">{sandboxResult.reasoning}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1 font-sans font-bold">Matched Knowledge Sources:</span>
                {sandboxResult.matchedKnowledgeSources && sandboxResult.matchedKnowledgeSources.length > 0 ? (
                  <div className="space-y-1.5">
                    {sandboxResult.matchedKnowledgeSources.map((source: any) => (
                      <div key={source.id} className="text-teal-700 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] flex items-center gap-2 font-sans font-medium">
                        <span className="material-symbols-outlined text-sm text-teal-600">description</span>
                        <span>{source.title} ({source.category})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px] font-sans">No matching knowledge snippets found.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Adding Knowledge Item */}
      {showAddKbModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Knowledge Base Snippet</h3>
              <button onClick={() => setShowAddKbModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddKbItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. GLP-1 Side Effects FAQ"
                  value={newKbTitle}
                  onChange={(e) => setNewKbTitle(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={newKbCategory}
                  onChange={(e) => setNewKbCategory(e.target.value as any)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:bg-white focus:outline-none focus:border-teal-500"
                >
                  <option value="FAQ">FAQ</option>
                  <option value="MEDICAL_PROTOCOL">MEDICAL_PROTOCOL</option>
                  <option value="PRICING_POLICY">PRICING_POLICY</option>
                  <option value="CLINIC_INFO">CLINIC_INFO</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Knowledge Content</label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed facts, guidelines, or answers..."
                  value={newKbContent}
                  onChange={(e) => setNewKbContent(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKbModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingKb}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {addingKb ? 'Adding...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

