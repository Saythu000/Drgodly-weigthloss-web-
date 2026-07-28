'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

/* --------------------------------- Types -------------------------------- */
interface StageConfig {
  id: string;
  name: string;
  probability: number;
  stageType: 'open' | 'won' | 'lost';
  color: string;
  position?: number;
}

interface Pipeline {
  id: string;
  name: string;
  isDefault?: boolean;
  stages: StageConfig[];
}

interface DealCard {
  id: string;
  pipelineId: string;
  stageId: string;
  title: string;
  value: number;
  currency?: string;
  status?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  contactWaNumber?: string;
  contactNumber?: string;
  contactName?: string;
  expectedCloseDate?: string;
  notes?: string;
  shippingState?: string;
  bmi?: number;
  clinicalStatus?: string;
  orderCount?: number;
  createdAt?: string;
}

interface Metrics {
  totalDeals: number;
  pipelineValue: number;
  avgDealSize: number;
  weightedValue: number;
  wonThisMonth: number;
  lostThisMonth: number;
}

const fmtMoney = (n: number) => {
  return `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
};

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [stages, setStages] = useState<StageConfig[]>([]);
  const [deals, setDeals] = useState<DealCard[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Dropdown states
  const [pipeSelectOpen, setPipeSelectOpen] = useState(false);
  const [pipeMenuOpen, setPipeMenuOpen] = useState(false);

  // Modals state
  const [dealModal, setDealModal] = useState<{ deal: DealCard | null; defaultStageId: string } | null>(null);
  const [pipelineModal, setPipelineModal] = useState<{ mode: 'create' | 'rename' } | null>(null);
  const [stagesModal, setStagesModal] = useState(false);

  // Patient detail drawer state
  const [selectedPatient, setSelectedPatient] = useState<DealCard | null>(null);

  // Drag and Drop State
  const [draggedDeal, setDraggedDeal] = useState<DealCard | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0] || null;

  // Fetch pipeline data
  const loadPipelineData = useCallback(async (targetId?: string) => {
    try {
      setUpdating(true);
      const url = targetId ? `/api/bot/pipelines?pipelineId=${targetId}` : '/api/bot/pipelines';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPipelines(data.pipelines || []);
        const activeId = targetId || data.selectedPipelineId || data.pipelines[0]?.id || null;
        setSelectedPipelineId(activeId);
        setStages(data.stages || []);
        setDeals(data.deals || []);
        setMetrics(data.metrics || null);
      }
    } catch (e) {
      console.error('Failed to load pipelines data:', e);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  // Handle Drag & Drop move
  const handleDropToStage = async (stageId: string) => {
    setDragOverStageId(null);
    const deal = draggedDeal;
    setDraggedDeal(null);
    if (!deal || deal.stageId === stageId) return;

    // Optimistic UI move
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stageId } : d)));

    try {
      const res = await fetch('/api/bot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'move-deal', dealId: deal.id, stageId }),
      });
      const data = await res.json();
      if (!data.success) {
        alert('Failed to move stage');
        loadPipelineData(selectedPipelineId || undefined);
      } else {
        loadPipelineData(selectedPipelineId || undefined);
      }
    } catch (e) {
      console.error('Failed to move stage:', e);
      loadPipelineData(selectedPipelineId || undefined);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-on-surface-variant font-sans">
        <span className="material-symbols-outlined animate-spin text-3xl text-secondary mr-3">progress_activity</span>
        <span className="font-semibold text-sm">Loading Pipelines & Kanban Board...</span>
      </div>
    );
  }

  return (
    <main id="section-pipelines" className="flex-1 overflow-hidden p-8 flex flex-col bg-surface relative h-full">
      {/* Header Banner & Multi-Pipeline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-headline-sm text-xl font-bold text-on-surface tracking-tight flex items-center gap-2">
              Clinical Patient Pipelines
            </h1>
            <p className="text-xs text-on-surface-variant/70 mt-0.5">
              Multi-pipeline sales tracking, physician review workflow, and prescription dispatch
            </p>
          </div>

          {/* Pipeline Selector Dropdown */}
          {selectedPipeline && (
            <div className="relative ml-2">
              <button
                type="button"
                onClick={() => setPipeSelectOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer shadow-sm"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span>{selectedPipeline.name}</span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
              </button>

              {pipeSelectOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPipeSelectOpen(false)} />
                  <div className="absolute top-10 left-0 w-64 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl z-50 py-1.5 space-y-0.5">
                    {pipelines.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPipelineId(p.id);
                          setPipeSelectOpen(false);
                          loadPipelineData(p.id);
                        }}
                        className={`px-3.5 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-surface-container-high transition-colors ${
                          p.id === selectedPipelineId ? 'font-bold text-secondary bg-surface-container-low' : 'text-on-surface font-medium'
                        }`}
                      >
                        <span>{p.name}</span>
                        {p.isDefault && <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">default</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pipeline Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPipelineModal({ mode: 'create' })}
            className="px-3 py-1.5 bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => setDealModal({ deal: null, defaultStageId: stages[0]?.id || '' })}
            className="px-3.5 py-1.5 bg-secondary text-white hover:bg-secondary/90 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add_card</span>
            <span>+ Add Patient / Deal</span>
          </button>

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPipeMenuOpen((o) => !o)}
              className="p-1.5 bg-surface-container-high border border-outline-variant/30 hover:bg-surface-container text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
              title="Pipeline settings"
            >
              <span className="material-symbols-outlined text-base">more_vert</span>
            </button>

            {pipeMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPipeMenuOpen(false)} />
                <div className="absolute top-10 right-0 w-48 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl z-50 py-1.5 space-y-0.5">
                  <div
                    onClick={() => {
                      setPipeMenuOpen(false);
                      setStagesModal(true);
                    }}
                    className="px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-high cursor-pointer flex items-center gap-2 font-medium"
                  >
                    <span className="material-symbols-outlined text-sm text-secondary">tune</span>
                    <span>Manage stages</span>
                  </div>
                  <div
                    onClick={() => {
                      setPipeMenuOpen(false);
                      setPipelineModal({ mode: 'rename' });
                    }}
                    className="px-3.5 py-2 text-xs text-on-surface hover:bg-surface-container-high cursor-pointer flex items-center gap-2 font-medium"
                  >
                    <span className="material-symbols-outlined text-sm text-amber-600">edit</span>
                    <span>Rename pipeline</span>
                  </div>
                  <div
                    onClick={async () => {
                      setPipeMenuOpen(false);
                      if (!selectedPipeline) return;
                      if (!window.confirm(`Delete pipeline "${selectedPipeline.name}" and all its deals?`)) return;
                      try {
                        const res = await fetch('/api/bot/pipelines', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'delete-pipeline', pipelineId: selectedPipeline.id }),
                        });
                        const data = await res.json();
                        if (data.success) loadPipelineData();
                        else alert(data.error || 'Delete failed');
                      } catch (e) {
                        alert('Delete failed');
                      }
                    }}
                    className="px-3.5 py-2 text-xs text-error hover:bg-error/10 cursor-pointer flex items-center gap-2 font-semibold border-t border-outline-variant/20 mt-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>Delete pipeline</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top 6 KPI Analytics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 shrink-0">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm text-blue-500">bar_chart</span>
            <span>Total Deals</span>
          </div>
          <div className="text-xl font-extrabold text-on-surface font-mono">{metrics?.totalDeals ?? deals.length}</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm text-emerald-500">account_balance_wallet</span>
            <span>Pipeline Value</span>
          </div>
          <div className="text-xl font-extrabold text-on-surface font-mono">{fmtMoney(metrics?.pipelineValue || 0)}</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm text-amber-500">ads_click</span>
            <span>Avg Deal Size</span>
          </div>
          <div className="text-xl font-extrabold text-on-surface font-mono">{fmtMoney(metrics?.avgDealSize || 0)}</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm text-purple-500">trending_up</span>
            <span>Weighted Value</span>
          </div>
          <div className="text-xl font-extrabold text-on-surface font-mono">{fmtMoney(metrics?.weightedValue || 0)}</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm text-teal-500">emoji_events</span>
            <span>Won This Month</span>
          </div>
          <div className="text-xl font-extrabold text-teal-600 font-mono">{metrics?.wonThisMonth ?? 0}</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm text-red-500">cancel</span>
            <span>Lost This Month</span>
          </div>
          <div className="text-xl font-extrabold text-error font-mono">{metrics?.lostThisMonth ?? 0}</div>
        </div>
      </div>

      {/* HTML5 Drag & Drop Kanban Grid */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-6 custom-scrollbar min-h-0 items-start">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stageId === stage.id);
          const totalVal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
          const isOver = dragOverStageId === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStageId(stage.id);
              }}
              onDragLeave={() => setDragOverStageId((curr) => (curr === stage.id ? null : curr))}
              onDrop={() => handleDropToStage(stage.id)}
              className={`w-[290px] shrink-0 bg-surface-container-lowest border rounded-2xl flex flex-col max-h-full transition-all shadow-sm ${
                isOver ? 'border-secondary ring-2 ring-secondary/20 scale-[1.01]' : 'border-outline-variant/30'
              }`}
              style={{ borderTop: `3px solid ${stage.color || '#64748B'}` }}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-outline-variant/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-on-surface tracking-wide">{stage.name}</span>
                  <span className="text-[11px] font-bold bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant/70">
                  <span>{fmtMoney(totalVal)}</span>
                  <span className="font-mono text-[10px]">{stage.probability}% win</span>
                </div>
              </div>

              {/* Deals List */}
              <div className="p-2.5 overflow-y-auto flex-1 min-h-[140px] space-y-2.5 custom-scrollbar">
                {stageDeals.length === 0 ? (
                  <div
                    className={`p-6 text-center text-xs text-on-surface-variant/40 italic border border-dashed rounded-xl transition-all ${
                      isOver ? 'border-secondary bg-secondary/5 text-secondary' : 'border-outline-variant/20'
                    }`}
                  >
                    Drop a deal card here
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggedDeal(deal)}
                      onClick={() => setSelectedPatient(deal)}
                      className="bg-surface border border-outline-variant/30 hover:border-secondary rounded-xl p-3 shadow-sm hover:shadow-md transition-all space-y-2 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                          {deal.title}
                        </span>
                        <span className="material-symbols-outlined text-sm text-on-surface-variant/40 shrink-0 cursor-grab">
                          drag_indicator
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-xs text-emerald-600">{fmtMoney(deal.value)}</span>
                        {deal.assignedUserName && (
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-full">
                            {deal.assignedUserName}
                          </span>
                        )}
                      </div>

                      {deal.contactName && (
                        <div className="text-[11px] text-on-surface-variant/80 flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-xs text-secondary">person</span>
                          <span className="truncate">{deal.contactName}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Column Footer */}
              <div className="p-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setDealModal({ deal: null, defaultStageId: stage.id })}
                  className="w-full py-1.5 text-xs text-on-surface-variant/70 hover:text-secondary hover:bg-surface-container font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Add Deal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Patient Drawer Overlay */}
      <div
        id="patient-drawer"
        className={`fixed top-0 right-0 h-full w-[460px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl z-50 transform transition-all duration-300 ease-in-out flex flex-col ${
          selectedPatient ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedPatient && (
          <>
            {/* Drawer Header */}
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shadow-sm">
                  {(selectedPatient.contactName || selectedPatient.title)[0]}
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-base">{selectedPatient.contactName || selectedPatient.title}</h4>
                  <p className="text-xs text-on-surface-variant font-mono">{selectedPatient.contactNumber || '—'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-surface-container-low rounded-xl transition-all cursor-pointer"
                title="Close details"
              >
                <span className="material-symbols-outlined text-xl text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Deal Value</span>
                  <span className="text-sm font-extrabold text-emerald-600 font-mono">{fmtMoney(selectedPatient.value)}</span>
                </div>
                <div className="p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Current Stage</span>
                  <span className="text-xs font-bold text-secondary">
                    {stages.find((s) => s.id === selectedPatient.stageId)?.name || selectedPatient.stageId}
                  </span>
                </div>
              </div>

              {/* Patient Attributes */}
              <div className="p-4 bg-surface border border-outline-variant/30 rounded-xl space-y-3">
                <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">Clinical Intake Details</h5>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-on-surface-variant/70 block text-[10px]">Calculated BMI:</span>
                    <span className="font-mono font-bold text-on-surface">{selectedPatient.bmi || 28.5}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 block text-[10px]">State:</span>
                    <span className="font-semibold text-on-surface">{selectedPatient.shippingState || 'Telangana'}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 block text-[10px]">Assigned Staff:</span>
                    <span className="font-bold text-purple-600">{selectedPatient.assignedUserName || 'Dr. Kalyan'}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/70 block text-[10px]">Expected Close:</span>
                    <span className="font-mono text-on-surface">{selectedPatient.expectedCloseDate || '—'}</span>
                  </div>
                </div>
              </div>

              {selectedPatient.notes && (
                <div className="p-4 bg-surface border border-outline-variant/30 rounded-xl space-y-1.5">
                  <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">Physician & Intake Notes</h5>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{selectedPatient.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Verify Method B payment for order #${selectedPatient.id}? This will auto-send the 24-hour dispatch promise to patient.`)) return;
                    try {
                      const res = await fetch('/api/bot/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'verify-payment', orderId: selectedPatient.id }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert(`✅ ${data.message}`);
                        setSelectedPatient(null);
                        loadPipelineData(selectedPipelineId || undefined);
                      } else alert(data.error || 'Failed');
                    } catch (e) {
                      alert('Verification failed');
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Verify Method B Payment ✅</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const courierName = window.prompt('Enter Courier Partner Name (e.g. BlueDart, Delhivery, DTDC):', 'BlueDart');
                    if (!courierName) return;
                    const trackingAwb = window.prompt(`Enter AWB Tracking Number for order #${selectedPatient.id}:`, 'BLD90847120');
                    if (!trackingAwb) return;

                    try {
                      const res = await fetch('/api/bot/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'mark-dispatched', orderId: selectedPatient.id, courierName, trackingAwb }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert(`📦 ${data.message}`);
                        setSelectedPatient(null);
                        loadPipelineData(selectedPipelineId || undefined);
                      } else alert(data.error || 'Failed');
                    } catch (e) {
                      alert('Dispatch update failed');
                    }
                  }}
                  className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                  <span>Mark Dispatched & Send Tracker 📦</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const editDeal = selectedPatient;
                    setSelectedPatient(null);
                    setDealModal({ deal: editDeal, defaultStageId: editDeal.stageId });
                  }}
                  className="w-full py-2.5 bg-surface-container-high border border-outline-variant/30 text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Edit Deal Details</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const targetStage = stages.find((s) => s.name.toLowerCase().includes('doctor') || s.name.toLowerCase().includes('review'));
                    if (targetStage) {
                      await handleDropToStage(targetStage.id);
                      setSelectedPatient(null);
                    }
                  }}
                  className="w-full py-2.5 bg-secondary text-white font-bold text-xs rounded-xl shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">local_hospital</span>
                  <span>Refer to Dr. Kalyan for Medical Assessment</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {dealModal && (
        <DealModal
          deal={dealModal.deal}
          defaultStageId={dealModal.defaultStageId}
          pipelineId={selectedPipelineId || ''}
          stages={stages}
          onClose={() => setDealModal(null)}
          onSaved={() => {
            setDealModal(null);
            loadPipelineData(selectedPipelineId || undefined);
          }}
        />
      )}

      {pipelineModal && (
        <PipelineModal
          mode={pipelineModal.mode}
          currentPipeline={pipelineModal.mode === 'rename' ? selectedPipeline : null}
          onClose={() => setPipelineModal(null)}
          onSaved={(newId) => {
            setPipelineModal(null);
            loadPipelineData(newId);
          }}
        />
      )}

      {stagesModal && selectedPipeline && (
        <StagesModal
          pipelineId={selectedPipeline.id}
          pipelineName={selectedPipeline.name}
          initialStages={stages}
          onClose={() => setStagesModal(false)}
          onChanged={() => loadPipelineData(selectedPipeline.id)}
        />
      )}
    </main>
  );
}

/* ------------------------------- DealModal -------------------------------- */
function DealModal({
  deal,
  defaultStageId,
  pipelineId,
  stages,
  onClose,
  onSaved,
}: {
  deal: DealCard | null;
  defaultStageId: string;
  pipelineId: string;
  stages: StageConfig[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!deal;
  const [form, setForm] = useState({
    title: deal?.title || '',
    value: deal?.value ?? 14500,
    stageId: deal?.stageId || defaultStageId || stages[0]?.id || '',
    assignedUserId: deal?.assignedUserId || 'doc-1',
    contactWaNumber: deal?.contactWaNumber || '',
    contactNumber: deal?.contactNumber || '',
    contactName: deal?.contactName || '',
    expectedCloseDate: deal?.expectedCloseDate ? String(deal.expectedCloseDate).slice(0, 10) : '',
    notes: deal?.notes || '',
  });

  const [saving, setSaving] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [contactResults, setContactResults] = useState<any[]>([]);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (!contactQuery.trim()) {
      setContactResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/bot/pipelines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'search-contacts', query: contactQuery }),
        });
        const data = await res.json();
        if (data.success) setContactResults(data.contacts || []);
      } catch (e) {
        setContactResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [contactQuery]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Deal title is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/bot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-deal',
          dealId: deal?.id,
          pipelineId,
          ...form,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        alert(data.error || 'Save failed');
      }
    } catch (e) {
      alert('Failed to save deal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (!window.confirm(`Delete deal "${deal.title}"?`)) return;
    try {
      const res = await fetch('/api/bot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-deal', dealId: deal.id }),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else alert(data.error || 'Delete failed');
    } catch (e) {
      alert('Delete failed');
    }
  };

  return (
    <ModalShell title={editing ? 'Edit Deal' : 'New Patient Deal'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Title</label>
          <input
            type="text"
            className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Kalyan Sontha - Wegovy Intake"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Value (₹)</label>
            <input
              type="number"
              className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface font-mono outline-none focus:border-secondary"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Stage</label>
            <select
              className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary cursor-pointer"
              value={form.stageId}
              onChange={(e) => setForm({ ...form, stageId: e.target.value })}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linked Contact */}
        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Linked Contact (Optional)</label>
          {form.contactName || form.contactNumber ? (
            <div className="flex items-center justify-between p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs">
              <span className="font-bold text-on-surface">{form.contactName || form.contactNumber}</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, contactWaNumber: '', contactNumber: '', contactName: '' })}
                className="text-error font-bold"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
                placeholder="Search contacts by name or phone..."
                value={contactQuery}
                onFocus={() => setContactOpen(true)}
                onChange={(e) => {
                  setContactQuery(e.target.value);
                  setContactOpen(true);
                }}
              />
              {contactOpen && contactResults.length > 0 && (
                <div className="absolute top-11 left-0 right-0 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto py-1">
                  {contactResults.map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setForm({
                          ...form,
                          contactWaNumber: c.waNumber,
                          contactNumber: c.contactNumber,
                          contactName: c.name,
                        });
                        setContactOpen(false);
                      }}
                      className="px-3.5 py-2 text-xs hover:bg-surface-container cursor-pointer flex justify-between"
                    >
                      <span className="font-bold text-on-surface">{c.name}</span>
                      <span className="font-mono text-on-surface-variant">{c.contactNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Expected Close</label>
            <input
              type="date"
              className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Assigned Staff</label>
            <select
              className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary cursor-pointer"
              value={form.assignedUserId}
              onChange={(e) => setForm({ ...form, assignedUserId: e.target.value })}
            >
              <option value="doc-1">Dr. Kalyan (Physician)</option>
              <option value="staff-1">Clinic Staff</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Notes</label>
          <textarea
            rows={3}
            className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
            placeholder="Clinical background, dosage details, intake notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-outline-variant/20">
        {editing ? (
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 text-xs font-bold text-error bg-error/10 hover:bg-error/20 rounded-xl transition-all"
          >
            Delete
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-white bg-secondary hover:bg-secondary/90 rounded-xl transition-all shadow-sm"
          >
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Deal'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ----------------------------- PipelineModal ------------------------------ */
function PipelineModal({
  mode,
  currentPipeline,
  onClose,
  onSaved,
}: {
  mode: 'create' | 'rename';
  currentPipeline: Pipeline | null;
  onClose: () => void;
  onSaved: (newId?: string) => void;
}) {
  const [name, setName] = useState(currentPipeline?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const action = mode === 'rename' ? 'rename-pipeline' : 'create-pipeline';
      const res = await fetch('/api/bot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, pipelineId: currentPipeline?.id, name: name.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(data.pipeline?.id);
      } else {
        alert(data.error || 'Failed to save pipeline');
      }
    } catch (e) {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={mode === 'rename' ? 'Rename Pipeline' : 'New Pipeline'} onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Pipeline Name</label>
        <input
          type="text"
          className="w-full p-2.5 bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-secondary"
          placeholder="e.g. Enterprise Telehealth Pipeline"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {mode === 'create' && (
          <p className="text-xs text-on-surface-variant/70">
            Starts with standard clinical stages (New Intake → Doctor Review → Approved → Prescription Sent → Order Placed).
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-xs font-bold text-white bg-secondary hover:bg-secondary/90 rounded-xl transition-all shadow-sm"
        >
          {saving ? 'Saving...' : 'Save Pipeline'}
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------- StagesModal ------------------------------ */
function StagesModal({
  pipelineId,
  pipelineName,
  initialStages,
  onClose,
  onChanged,
}: {
  pipelineId: string;
  pipelineName: string;
  initialStages: StageConfig[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [stagesList, setStagesList] = useState<StageConfig[]>(initialStages);
  const [busy, setBusy] = useState(false);

  const saveStageRow = async (stg: StageConfig) => {
    setBusy(true);
    try {
      const res = await fetch('/api/bot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-stage',
          pipelineId,
          stageId: stg.id,
          name: stg.name,
          probability: stg.probability,
          color: stg.color,
          stageType: stg.stageType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.stages) setStagesList(data.stages);
        onChanged();
      } else alert(data.error || 'Save failed');
    } catch (e) {
      alert('Save failed');
    } finally {
      setBusy(false);
    }
  };

  const addStageRow = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/bot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-stage',
          pipelineId,
          name: 'New Stage',
          probability: 50,
          color: '#64748B',
          stageType: 'open',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.stages) setStagesList(data.stages);
        onChanged();
      } else alert(data.error || 'Add failed');
    } catch (e) {
      alert('Add failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteStageRow = async (stgId: string) => {
    if (!window.confirm('Delete this stage?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/bot/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-stage', stageId: stgId }),
      });
      const data = await res.json();
      if (data.success) {
        setStagesList((prev) => prev.filter((s) => s.id !== stgId));
        onChanged();
      } else alert(data.error || 'Delete failed');
    } catch (e) {
      alert('Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title={`Manage Stages · ${pipelineName}`} onClose={onClose}>
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
        {stagesList.map((stg) => (
          <div key={stg.id} className="flex items-center gap-2 p-2 bg-surface-container-high border border-outline-variant/30 rounded-xl">
            <input
              type="color"
              className="w-7 h-7 rounded border-none bg-transparent cursor-pointer shrink-0"
              value={stg.color || '#64748B'}
              onChange={(e) =>
                setStagesList((prev) => prev.map((s) => (s.id === stg.id ? { ...s, color: e.target.value } : s)))
              }
            />
            <input
              type="text"
              className="flex-1 p-1.5 bg-surface border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface outline-none"
              value={stg.name}
              onChange={(e) =>
                setStagesList((prev) => prev.map((s) => (s.id === stg.id ? { ...s, name: e.target.value } : s)))
              }
            />
            <input
              type="number"
              className="w-16 p-1.5 bg-surface border border-outline-variant/30 rounded-lg text-xs font-mono font-bold text-on-surface text-center outline-none"
              value={stg.probability}
              onChange={(e) =>
                setStagesList((prev) => prev.map((s) => (s.id === stg.id ? { ...s, probability: Number(e.target.value) } : s)))
              }
              title="Win Probability %"
            />
            <select
              className="w-20 p-1.5 bg-surface border border-outline-variant/30 rounded-lg text-xs text-on-surface font-semibold outline-none cursor-pointer"
              value={stg.stageType}
              onChange={(e) =>
                setStagesList((prev) =>
                  prev.map((s) => (s.id === stg.id ? { ...s, stageType: e.target.value as any } : s))
                )
              }
            >
              <option value="open">Open</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <button
              type="button"
              onClick={() => saveStageRow(stg)}
              disabled={busy}
              className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
              title="Save Stage"
            >
              <span className="material-symbols-outlined text-base">check</span>
            </button>
            <button
              type="button"
              onClick={() => deleteStageRow(stg.id)}
              disabled={busy}
              className="p-1.5 text-error hover:bg-error/10 rounded-lg"
              title="Delete Stage"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={addStageRow}
          disabled={busy}
          className="px-3.5 py-1.5 text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-all flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Add Stage</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-white bg-secondary hover:bg-secondary/90 rounded-xl shadow-sm"
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
}

/* ----------------------------- Shell Modal ------------------------------- */
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative font-sans"
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-outline-variant/20">
          <h3 className="font-bold text-base text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-lg">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
