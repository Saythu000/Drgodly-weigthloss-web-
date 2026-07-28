'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const CapsuleCanvas = dynamic(() => import('@/components/CapsuleCanvas'), {
  ssr: false,
});

interface LogItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  status: 'warning' | 'error' | 'info';
}

interface OverviewMetrics {
  totalPatients: number;
  totalOrders: number;
  totalRevenue: number;
  pendingReviews: number;
}

type WaStatusKind = 'disconnected' | 'awaitingPair' | 'pairing' | 'connected';

export default function OverviewPage() {
  const [waStatus, setWaStatus] = useState<WaStatusKind>('disconnected');
  const [sessionText, setSessionText] = useState('—');
  const [syncStatus, setSyncStatus] = useState('never');
  const [statusBadge, setStatusBadge] = useState('DISCONNECTED');
  const [statusDotColor, setStatusDotColor] = useState('bg-error');
  const [statusBadgeClass, setStatusBadgeClass] = useState('bg-red-100 text-red-800');
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);

  // Dynamic Metrics state from Neon Cloud PostgreSQL
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalPatients: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingReviews: 0,
  });

  const [logs, setLogs] = useState<LogItem[]>([]);

  // Fetch dynamic metrics from Neon PostgreSQL via /api/bot/metrics
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/bot/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics({
          totalPatients: data.totalPatients,
          totalOrders: data.totalOrders,
          totalRevenue: data.totalRevenue,
          pendingReviews: data.pendingReviews,
        });
      }
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
  };

  // Fetch telemetry logs from /api/bot/logs
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/bot/logs');
      const data = await res.json();
      if (data.success && data.logs && data.logs.length > 0) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchLogs();
    const metricsInterval = setInterval(fetchMetrics, 5000);
    const logsInterval = setInterval(fetchLogs, 10000);
    return () => {
      clearInterval(metricsInterval);
      clearInterval(logsInterval);
    };
  }, []);

  // Poll connection status & apply state transitions matching dashboard.ts lines 190-240
  const applyStateTransitions = (status: WaStatusKind, phone?: string) => {
    setWaStatus(status);
    if (status === 'connected') {
      setQrImageDataUrl(null);
      setStatusBadge('CONNECTED');
      setStatusDotColor('bg-emerald-500');
      setStatusBadgeClass('bg-emerald-100 text-emerald-800');
      setSessionText(phone ? `Connected as +${phone}` : 'Connected');
      setSyncStatus('Active');
    } else if (status === 'pairing' || status === 'awaitingPair') {
      setStatusBadge('ATTENTION');
      setStatusDotColor('bg-amber-500');
      setStatusBadgeClass('bg-amber-100 text-amber-800');
      setSessionText('Awaiting Pairing...');
      setSyncStatus('not configured');
    } else {
      setQrImageDataUrl(null);
      setStatusBadge('DISCONNECTED');
      setStatusDotColor('bg-error');
      setStatusBadgeClass('bg-red-100 text-red-800');
      setSessionText('—');
      setSyncStatus('never');
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/bot/status');
        const data = await res.json();
        if (data.success) {
          applyStateTransitions(data.status, data.phoneNumber);
        }
      } catch (e) {
        // ignore poll errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Button 1: Open Pairing Window / Re-pair Gateway
  const handleOpenPairing = async () => {
    setPairingLoading(true);
    try {
      const res = await fetch('/api/bot/pair', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.status === 'connected') {
          applyStateTransitions('connected', data.phoneNumber);
        } else if (data.qrImage) {
          setQrImageDataUrl(data.qrImage);
          applyStateTransitions('pairing');
          setLogs((prev) => [
            {
              id: Date.now().toString(),
              title: 'Live Meta Pairing Window Opened',
              detail: 'Generated authentic WebSocket QR code. Scan with WhatsApp.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'info',
            },
            ...prev,
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPairingLoading(false);
    }
  };

  // Button 2: Reset WhatsApp
  const handleResetWhatsApp = async () => {
    try {
      const res = await fetch('/api/bot/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        applyStateTransitions('disconnected');
        setLogs((prev) => [
          {
            id: Date.now().toString(),
            title: 'Gateway Reset',
            detail: 'Session credentials cleared. Connection reset.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'warning',
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Button 3: Force Sync
  const handleForceSync = async () => {
    try {
      const res = await fetch('/api/bot/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`Active (${data.syncTime})`);
        fetchMetrics();
        setLogs((prev) => [
          {
            id: Date.now().toString(),
            title: 'Force Sync Executed',
            detail: `Synchronized patients & messages at ${data.syncTime}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'info',
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isConnected = waStatus === 'connected';

  return (
    <main id="section-overview" className="flex-1 h-full overflow-hidden p-8 flex gap-8">
      {/* Left Pane: WhatsApp Gateway & Stats (60%) */}
      <div className="flex-[0.6] flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {/* Combined Telemetry Hub Panel matching Image 1 */}
        <section
          id="telemetry-hub-card"
          className="bg-surface-container-lowest p-8 rounded-2xl card-shadow border border-outline-variant/30 flex flex-col gap-6 transition-all hover:scale-[1.002]"
        >
          {/* Top: Link WhatsApp & QR (2 column layout) - Hides when connected matching backup app line 212 */}
          <div
            id="qr-container-card"
            className={`flex flex-col md:flex-row gap-8 items-center border-b border-outline-variant/30 pb-6 relative z-10 ${
              isConnected ? 'hidden' : ''
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${statusDotColor} animate-pulse`}></span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Link WhatsApp Gateway</h3>
              </div>
              <p className="text-on-surface-variant text-sm mb-6">
                Scan the QR code with your mobile device to enable real-time patient telemetry and automated protocols.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-[12px] font-bold">1</span>
                  <span className="text-sm text-on-surface-variant">Open WhatsApp on your phone</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-[12px] font-bold">2</span>
                  <span className="text-sm text-on-surface-variant">
                    Go to <span className="font-semibold text-on-surface">Linked Devices</span> in settings
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-[12px] font-bold">3</span>
                  <span className="text-sm text-on-surface-variant">Point your camera at this screen</span>
                </div>
              </div>
              <button
                id="btn-pair"
                onClick={handleOpenPairing}
                disabled={pairingLoading}
                className="w-full md:w-auto px-6 py-3 bg-secondary text-on-secondary rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-secondary/90 transition-all teal-glow group/btn cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[20px] ${pairingLoading ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>
                  {pairingLoading
                    ? 'Connecting Meta WS...'
                    : isConnected
                    ? 'Re-pair Gateway'
                    : 'Open Pairing Window'}
                </span>
              </button>
            </div>

            {/* Real Base64 PNG QR Box matching Image 1 */}
            <div className="shrink-0 p-4 bg-white rounded-2xl border border-outline-variant/30 shadow-sm teal-glow">
              <div id="qr-box" className="w-48 h-48 bg-surface-container flex items-center justify-center rounded-lg relative overflow-hidden p-1">
                {qrImageDataUrl ? (
                  /* Render Real PNG QR Code */
                  <img
                    src={qrImageDataUrl}
                    alt="WhatsApp Pairing QR Code"
                    className="w-full h-full object-contain animate-in fade-in duration-300"
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <span className="material-symbols-outlined text-[72px] text-secondary/40">qr_code_scanner</span>
                    <span className="text-[10px] text-on-surface-variant font-semibold block">Click Open Pairing Window</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom: Service Status row & Stats matching Image 1 */}
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">Service Status</h3>
                <div className="flex items-center gap-3">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Telemetry Hub</span>
                  <div
                    id="status-pill"
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 uppercase tracking-wider ${statusBadgeClass}`}
                  >
                    {statusBadge}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant">
                  <span>
                    Session: <strong id="wa-line" className="font-semibold text-on-surface">{sessionText}</strong>
                  </span>
                  <span className="opacity-30">|</span>
                  <span>
                    Sync: <strong id="sync-line" className="font-semibold text-on-surface">{syncStatus}</strong>
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="btn-reset-wa"
                  onClick={handleResetWhatsApp}
                  className="px-4 py-2.5 border-2 border-error text-error rounded-xl font-label-md text-label-md flex items-center gap-2 hover:bg-error/5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  Reset WhatsApp
                </button>
                <button
                  id="btn-sync"
                  onClick={handleForceSync}
                  className="px-4 py-2.5 bg-secondary text-on-secondary rounded-xl font-label-md text-label-md flex items-center gap-2 hover:bg-secondary/90 transition-all teal-glow cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  Force Sync
                </button>
              </div>
            </div>

            {/* 4 Stats Cards with Dynamic PostgreSQL Data matching Backup App */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-secondary transition-all">
                <p className="text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase tracking-wider">Total Patients</p>
                <p className="text-headline-sm font-bold text-on-surface" id="overview-patients">{metrics.totalPatients}</p>
                <p className="text-[10px] text-secondary font-bold mt-1 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">group</span>
                  Registered Profiles
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-secondary transition-all">
                <p className="text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase tracking-wider">Total Orders</p>
                <p className="text-headline-sm font-bold text-on-surface" id="overview-orders">{metrics.totalOrders}</p>
                <p className="text-[10px] text-secondary font-bold mt-1 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">shopping_cart</span>
                  Placed via WhatsApp
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-secondary transition-all">
                <p className="text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase tracking-wider">Total Revenue</p>
                <p className="text-headline-sm font-bold text-secondary" id="overview-revenue">₹{metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-secondary font-bold mt-1 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">payments</span>
                  Estimated Earnings
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 hover:border-secondary transition-all">
                <p className="text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase tracking-wider">Pending Reviews</p>
                <p className="text-headline-sm font-bold text-error" id="overview-reviews">{metrics.pendingReviews}</p>
                <p className="text-[10px] text-error/80 font-bold mt-1 flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">clinical_notes</span>
                  Requires Doctor Action
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Telemetry Logs List matching Image 1 */}
        <section className="flex-1 bg-surface-container-lowest p-6 rounded-xl card-shadow border border-outline-variant/30 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Live Telemetry Logs</h3>
            <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded">REAL-TIME FEED</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3" id="activity" style={{ maxHeight: '350px' }}>
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${log.status === 'error' ? 'bg-error' : log.status === 'info' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <div className="text-xs font-bold text-on-surface">{log.title}</div>
                    <div className="text-[11px] text-on-surface-variant/80 font-mono">{log.detail}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant/60">{log.timestamp}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Pane: 3D Capsule Pill Animation matching Image 1 (40%) */}
      <div className="flex-[0.4] flex flex-col gap-6">
        <div className="flex-1 bg-primary-container rounded-3xl overflow-hidden relative group transition-all hover:scale-[1.01] flex flex-col min-h-[450px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/50 to-primary-container z-10 pointer-events-none"></div>

          <div className="relative z-20 p-8 text-white h-full flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="font-headline-lg text-headline-lg font-bold mb-2 leading-tight">
                Digital Medication<br />Management
              </h4>
              <p className="text-on-primary-container font-body-md text-body-md max-w-xs">
                Monitoring therapeutic outcomes through real-time WhatsApp telemetry.
              </p>
            </div>

            {/* 3D Capsule Pill Canvas Container matching Image 1 */}
            <div className="flex-1 flex items-center justify-center relative min-h-[260px]" id="animation-capsule-container">
              <CapsuleCanvas />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <span className="material-symbols-outlined text-secondary-fixed mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                  medical_information
                </span>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Protocol Version</p>
                <p className="font-headline-sm text-headline-sm font-semibold">GLP-1 Alpha</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                <span className="material-symbols-outlined text-secondary-fixed mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                  monitoring
                </span>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Precision Index</p>
                <p className="font-headline-sm text-headline-sm font-semibold">99.8%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
