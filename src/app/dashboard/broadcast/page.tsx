'use client';

import React, { useState, useEffect, useCallback } from 'react';

/* --------------------------------- Types -------------------------------- */
interface Broadcast {
  id: string;
  name: string;
  from_number: string;
  recipient_numbers: any[];
  template_id?: string;
  template_name?: string;
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'PARTIAL' | 'FAILED';
  message_type?: string;
  body?: string;
  url?: string;
  media_library_id?: string;
  caption?: string;
  variable_mapping?: Record<string, string>;
  last_activity?: string;
  created_at?: string;
  logs?: any[];
  statusRollup?: {
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

interface TemplateOption {
  templateId: string;
  name: string;
  category: string;
  language: string;
  status: string;
  headerType: string;
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: any[];
}

interface PatientRecipient {
  id: string;
  name: string;
  phone: string;
  state: string;
  status: string;
}

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENDING', label: 'Sending' },
  { key: 'SENT', label: 'Sent' },
  { key: 'PARTIAL', label: 'Partial' },
  { key: 'FAILED', label: 'Failed' },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    DRAFT: { bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' },
    SENDING: { bg: 'bg-blue-500/10', color: 'text-blue-600', border: 'border-blue-500/20', dot: 'bg-blue-500' },
    SENT: { bg: 'bg-emerald-500/10', color: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    PARTIAL: { bg: 'bg-amber-500/10', color: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    FAILED: { bg: 'bg-red-500/10', color: 'text-red-600', border: 'border-red-500/20', dot: 'bg-red-500' },
  };
  const c = config[status] || config.SENT;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${c.bg} ${c.color} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export default function BulkMessagePage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Selected Broadcast for Detail View
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);

  // Modal States
  const [newBroadcastModal, setNewBroadcastModal] = useState(false);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [recipientsList, setRecipientsList] = useState<PatientRecipient[]>([]);

  // Form State
  const [newBroadcastName, setNewBroadcastName] = useState('');
  const [newBroadcastFrom, setNewBroadcastFrom] = useState('919390834107');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
  const [newBroadcastMessageType, setNewBroadcastMessageType] = useState<'template' | 'text'>('template');
  const [newBroadcastTemplateId, setNewBroadcastTemplateId] = useState('');
  const [newBroadcastBody, setNewBroadcastBody] = useState('');
  const [newBroadcastTestNumber, setNewBroadcastTestNumber] = useState('');
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({ '1': 'name' });
  const [minDelay, setMinDelay] = useState(2);
  const [maxDelay, setMaxDelay] = useState(5);
  const [importedFileName, setImportedFileName] = useState('');
  const [csvUploadNotice, setCsvUploadNotice] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // CSV / Excel File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const parsedContacts: PatientRecipient[] = [];

      lines.forEach((line, idx) => {
        if (idx === 0 && (line.toLowerCase().includes('phone') || line.toLowerCase().includes('name'))) return;

        const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 1) {
          let name = 'Imported Lead';
          let phone = '';

          if (parts.length >= 2) {
            if (/^\+?\d[\d\s-]{8,}$/.test(parts[0])) {
              phone = parts[0];
              name = parts[1] || 'Imported Lead';
            } else {
              name = parts[0];
              phone = parts[1];
            }
          } else {
            phone = parts[0];
          }

          const cleanDigits = phone.replace(/\D/g, '');
          if (cleanDigits.length >= 10) {
            parsedContacts.push({
              id: `imported-${Date.now()}-${idx}`,
              name,
              phone: `+${cleanDigits}`,
              state: 'CSV Import',
              status: 'Lead',
            });
          }
        }
      });

      if (parsedContacts.length > 0) {
        setRecipientsList((prev) => [...parsedContacts, ...prev]);
        const nextSelected = new Set(selectedRecipientIds);
        parsedContacts.forEach((c) => nextSelected.add(c.id));
        setSelectedRecipientIds(nextSelected);
        setCsvUploadNotice(`✅ Imported ${parsedContacts.length} contacts from "${file.name}"`);
      } else {
        alert('No valid phone numbers found in CSV file. Ensure columns contain phone numbers.');
      }
    };

    reader.readAsText(file);
  };

  // Load broadcasts list
  const loadBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'all' ? '/api/bot/broadcast' : `/api/bot/broadcast?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setBroadcasts(data);
      }
    } catch (e) {
      console.error('Failed to load broadcasts:', e);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadBroadcasts();
  }, [loadBroadcasts]);

  // Load templates & patient recipients when modal opens
  useEffect(() => {
    if (!newBroadcastModal) return;
    fetch('/api/bot/templates')
      .then((r) => r.json())
      .then((d) => {
        if (d.templates) setTemplates(d.templates);
      })
      .catch(() => {});

    fetch('/api/bot/leads')
      .then((r) => r.json())
      .then((d) => {
        if (d.patients) {
          const mapped: PatientRecipient[] = d.patients.map((p: any) => ({
            id: p.id,
            name: p.name,
            phone: p.phoneNumber,
            state: p.area || 'Telangana',
            status: p.clinicalStatus,
          }));
          setRecipientsList(mapped);
          setSelectedRecipientIds(new Set(mapped.map((m) => m.id)));
        }
      })
      .catch(() => {});
  }, [newBroadcastModal]);

  // View detail handler
  const handleOpenDetail = async (b: Broadcast) => {
    try {
      const res = await fetch(`/api/bot/broadcast?id=${b.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBroadcast(data);
        setView('detail');
      }
    } catch (e) {
      setSelectedBroadcast(b);
      setView('detail');
    }
  };

  // Single Test Send Handler
  const handleSendTest = async () => {
    if (!newBroadcastTestNumber.trim()) {
      alert('Please enter a test phone number (e.g. 919390834107)');
      return;
    }
    setSendingTest(true);
    try {
      const selectedTpl = templates.find((t) => t.templateId === newBroadcastTemplateId);
      const bodyContent = newBroadcastMessageType === 'template' ? selectedTpl?.bodyText || '' : newBroadcastBody;

      const res = await fetch('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-broadcast',
          test_number: newBroadcastTestNumber.trim(),
          body: bodyContent,
          headerType: selectedTpl?.headerType,
          headerText: selectedTpl?.headerText,
          footerText: selectedTpl?.footerText,
          buttons: selectedTpl?.buttons,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Test message dispatched successfully to ${newBroadcastTestNumber.trim()}!`);
      } else {
        alert(`❌ Broadcast Test Failed: ${data.error || 'Check if WhatsApp is connected in Inbox'}`);
      }
    } catch (e: any) {
      alert(`❌ Test send failed: ${e?.message || 'Network Error'}`);
    } finally {
      setSendingTest(false);
    }
  };

  // Launch / Save Broadcast Handler
  const handleSaveBroadcast = async (status: 'DRAFT' | 'SENT') => {
    const selectedRecipients = recipientsList
      .filter((r) => selectedRecipientIds.has(r.id))
      .map((r) => ({ contact_number: r.phone, name: r.name, state: r.state }));

    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient contact');
      return;
    }

    setBroadcasting(true);
    try {
      const selectedTpl = templates.find((t) => t.templateId === newBroadcastTemplateId);

      const res = await fetch('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: status === 'SENT' ? 'send-broadcast' : 'create-broadcast',
          name: newBroadcastName.trim() || 'GLP-1 Patient Campaign',
          from_number: newBroadcastFrom,
          recipient_numbers: selectedRecipients,
          template_id: newBroadcastTemplateId || null,
          template_name: selectedTpl?.name || null,
          status,
          message_type: newBroadcastMessageType,
          body: newBroadcastMessageType === 'template' ? selectedTpl?.bodyText || '' : newBroadcastBody,
          variable_mapping: variableMapping,
          minDelay,
          maxDelay,
        }),
      });

      const data = await res.json();
      if (data.success || data.id) {
        alert(status === 'SENT' ? `Broadcast campaign dispatched to ${selectedRecipients.length} recipients!` : 'Broadcast saved as draft');
        setNewBroadcastModal(false);
        loadBroadcasts();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (e) {
      alert('Operation failed');
    } finally {
      setBroadcasting(false);
    }
  };

  // Delete Broadcast
  const handleDeleteBroadcast = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this broadcast campaign?')) return;
    try {
      const res = await fetch(`/api/bot/broadcast?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        if (selectedBroadcast?.id === id) {
          setView('list');
          setSelectedBroadcast(null);
        }
      } else alert(data.error || 'Delete failed');
    } catch (e) {
      alert('Delete failed');
    }
  };

  // Resolve template preview text
  const selectedTemplate = templates.find((t) => t.templateId === newBroadcastTemplateId);
  let resolvedPreviewBody = newBroadcastMessageType === 'template' ? selectedTemplate?.bodyText || '' : newBroadcastBody;
  if (selectedTemplate && variableMapping['1'] === 'name') {
    resolvedPreviewBody = resolvedPreviewBody.replace(/\{\{1\}\}/g, 'Kalyan Sontha');
  }

  // -------------------------------- DETAIL VIEW -------------------------------- //
  if (view === 'detail' && selectedBroadcast) {
    const r = selectedBroadcast.statusRollup || {
      total: selectedBroadcast.recipient_numbers?.length || 0,
      sent: selectedBroadcast.status === 'SENT' ? selectedBroadcast.recipient_numbers?.length || 0 : 0,
      delivered: selectedBroadcast.status === 'SENT' ? selectedBroadcast.recipient_numbers?.length || 0 : 0,
      read: selectedBroadcast.status === 'SENT' ? Math.floor((selectedBroadcast.recipient_numbers?.length || 0) * 0.8) : 0,
      failed: 0,
    };

    return (
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-surface space-y-6">
        {/* Back Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-xs font-bold text-secondary hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Campaigns</span>
          </button>

          <div className="flex items-center gap-2">
            <StatusBadge status={selectedBroadcast.status} />
            <button
              type="button"
              onClick={() => handleDeleteBroadcast(selectedBroadcast.id)}
              className="p-1.5 text-error hover:bg-error/10 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              <span>Delete Campaign</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-on-surface">{selectedBroadcast.name}</h1>
          <p className="text-xs text-on-surface-variant mt-1">From: +{selectedBroadcast.from_number} • Created {selectedBroadcast.created_at?.slice(0, 10)}</p>
        </div>

        {/* 4 Delivery Funnel KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Recipients</span>
              <span className="text-xl font-extrabold text-on-surface font-mono">{r.total}</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">send</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Sent</span>
              <span className="text-xl font-extrabold text-on-surface font-mono">{r.sent}</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Delivered</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono">{r.delivered}</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">visibility</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">Read</span>
              <span className="text-xl font-extrabold text-purple-600 font-mono">{r.read}</span>
            </div>
          </div>
        </div>

        {/* Campaign Content Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Campaign Message Copy</h3>
          <div className="p-4 bg-surface-container-high rounded-xl border border-outline-variant/20 text-xs font-sans text-on-surface leading-relaxed whitespace-pre-wrap">
            {selectedBroadcast.body || 'No text content'}
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------- LIST VIEW -------------------------------- //
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-surface space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-sm text-xl font-bold text-on-surface tracking-tight">Bulk Message Campaigns</h1>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">Manage your WhatsApp broadcast updates, patient refill reminders, and campaign logs</p>
        </div>

        <button
          type="button"
          onClick={() => setNewBroadcastModal(true)}
          className="px-4 py-2 bg-secondary text-white hover:bg-secondary/90 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>New Broadcast</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {FILTER_TABS.map((tab) => {
          const active = filterStatus === tab.key;
          const count = tab.key === 'all' ? broadcasts.length : broadcasts.filter((b) => b.status === tab.key).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                active
                  ? 'bg-secondary border-secondary text-white shadow-sm'
                  : 'bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Campaigns Data Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant/20 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              <th className="p-4">Broadcast</th>
              <th className="p-4">From</th>
              <th className="p-4">Recipients</th>
              <th className="p-4">Template</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Activity</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-on-surface-variant italic">
                  Loading campaigns...
                </td>
              </tr>
            ) : broadcasts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 block mb-2">radar</span>
                  <p className="font-bold text-xs">No broadcast campaigns found</p>
                  <p className="text-[11px] text-on-surface-variant/70 mt-1">Click "New Broadcast" to compose your first patient campaign.</p>
                </td>
              </tr>
            ) : (
              broadcasts.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => handleOpenDetail(b)}
                  className="hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <td className="p-4 font-bold text-on-surface">
                    <div>{b.name || 'Untitled Campaign'}</div>
                    <div className="text-[10px] font-mono font-normal text-on-surface-variant/70">#{b.id}</div>
                  </td>
                  <td className="p-4 font-mono text-on-surface-variant">+{b.from_number}</td>
                  <td className="p-4 font-semibold text-on-surface">
                    {Array.isArray(b.recipient_numbers) ? `${b.recipient_numbers.length} contacts` : '0 contacts'}
                  </td>
                  <td className="p-4 text-on-surface-variant">{b.template_name || '—'}</td>
                  <td className="p-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="p-4 text-on-surface-variant font-mono text-[11px]">
                    {b.last_activity ? b.last_activity.slice(0, 16).replace('T', ' ') : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteBroadcast(b.id, e)}
                      className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-all"
                      title="Delete Broadcast"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 2-Column New Broadcast Modal */}
      {newBroadcastModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setNewBroadcastModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-y-auto flex flex-col font-sans"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">send</span>
                <span>New Broadcast Campaign</span>
              </h3>
              <button onClick={() => setNewBroadcastModal(false)} className="text-on-surface-variant hover:text-on-surface text-lg">
                ✕
              </button>
            </div>

            {/* 2-Column Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
              {/* LEFT COLUMN: Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Broadcast Name</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
                    placeholder="e.g. GLP-1 Refill Reminder - April"
                    value={newBroadcastName}
                    onChange={(e) => setNewBroadcastName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">From Number</label>
                  <select
                    className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary cursor-pointer"
                    value={newBroadcastFrom}
                    onChange={(e) => setNewBroadcastFrom(e.target.value)}
                  >
                    <option value="919390834107">DrGodly WhatsApp (+91 93908 34107)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      To ({recipientsList.filter((r) => selectedRecipientIds.has(r.id)).length} / {recipientsList.length} Selected)
                    </label>
                    <label className="px-2.5 py-1 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">upload_file</span>
                      <span>Upload CSV / Excel</span>
                      <input type="file" accept=".csv, .txt, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {csvUploadNotice && <div className="text-[11px] font-bold text-emerald-600 mb-1">{csvUploadNotice}</div>}
                  <div className="max-h-32 overflow-y-auto p-2 bg-surface-container-high border border-outline-variant/30 rounded-xl space-y-1 custom-scrollbar">
                    {recipientsList.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 p-1.5 hover:bg-surface rounded-lg cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={selectedRecipientIds.has(r.id)}
                          onChange={() => {
                            const next = new Set(selectedRecipientIds);
                            if (next.has(r.id)) next.delete(r.id);
                            else next.add(r.id);
                            setSelectedRecipientIds(next);
                          }}
                          className="rounded text-secondary focus:ring-secondary"
                        />
                        <span className="font-bold text-on-surface">{r.name}</span>
                        <span className="font-mono text-on-surface-variant text-[10px]">({r.phone})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Min & Max Delay Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Min Delay (sec)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className="w-full p-2 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary font-mono"
                      value={minDelay}
                      onChange={(e) => setMinDelay(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Max Delay (sec)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      className="w-full p-2 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary font-mono"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Message Type</label>
                  <select
                    className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary cursor-pointer"
                    value={newBroadcastMessageType}
                    onChange={(e) => setNewBroadcastMessageType(e.target.value as any)}
                  >
                    <option value="template">Template Message</option>
                    <option value="text">Text Message</option>
                  </select>
                </div>

                {newBroadcastMessageType === 'template' ? (
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Select Meta Template</label>
                    <select
                      className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary cursor-pointer"
                      value={newBroadcastTemplateId}
                      onChange={(e) => setNewBroadcastTemplateId(e.target.value)}
                    >
                      <option value="">-- Choose Template --</option>
                      {templates.map((t) => (
                        <option key={t.templateId} value={t.templateId}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Message Body</label>
                    <textarea
                      rows={4}
                      className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
                      placeholder="Type custom text copy..."
                      value={newBroadcastBody}
                      onChange={(e) => setNewBroadcastBody(e.target.value)}
                    />
                  </div>
                )}

                {/* Single Test Number Input */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Single Test Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
                      placeholder="e.g. +919390834107"
                      value={newBroadcastTestNumber}
                      onChange={(e) => setNewBroadcastTestNumber(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleSendTest}
                      disabled={sendingTest}
                      className="px-3 py-2 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {sendingTest ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Authentic WhatsApp iPhone Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-3">Live WhatsApp Preview</span>

                {/* iPhone Frame */}
                <div className="w-[280px] bg-black rounded-[40px] p-2.5 shadow-2xl border-4 border-slate-700">
                  <div className="bg-[#075E54] text-white pt-8 pb-2 px-3 rounded-t-[32px] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">Dr</div>
                    <div>
                      <div className="text-xs font-bold leading-none">DrGodly Telehealth</div>
                      <div className="text-[9px] opacity-80">online</div>
                    </div>
                  </div>

                  <div className="bg-[#E5DDD5] dark:bg-[#0b141a] p-3 min-h-[260px] rounded-b-[32px] flex flex-col justify-end">
                    <div className="bg-[#DCF8C6] text-black rounded-lg p-3 text-xs space-y-1.5 shadow-sm relative">
                      {selectedTemplate?.headerText && <div className="font-bold text-[11px]">{selectedTemplate.headerText}</div>}
                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap">{resolvedPreviewBody || 'Select a template or type copy...'}</div>
                      {selectedTemplate?.footerText && <div className="text-[9px] text-gray-500">{selectedTemplate.footerText}</div>}
                      <div className="text-[9px] text-gray-400 text-right">09:41 AM ✓✓</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
              <button
                type="button"
                onClick={() => handleSaveBroadcast('DRAFT')}
                disabled={broadcasting}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all"
              >
                Save as Draft
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBroadcast('SENT')}
                  disabled={broadcasting}
                  className="px-5 py-2 bg-secondary text-white hover:bg-secondary/90 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {broadcasting ? 'Dispatching...' : '🚀 Send Broadcast'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
