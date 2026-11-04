'use client';

import React, { useState, useEffect } from 'react';
import { AttributionData, formatAttributionBadge } from '@/lib/tracking/attribution';

interface PatientLead {
  id: string;
  userId: string;
  phoneNumber: string;
  whatsappJid: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  area: string;
  clinicalStatus: 'Healthy' | 'Doctor Review' | 'Lead';
  orderCount: number;
  height: number | null;
  weight: number | null;
  goalWeight: number | null;
  gender: string;
  dateOfBirth: string | null;
  healthData: any;
  history: any;
  additionalInfo: string;
  attribution?: AttributionData | null;
  createdAt: string;
  orders: any[];
}

export default function LeadsDirectoryPage() {
  const [patients, setPatients] = useState<PatientLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<PatientLead | null>(null);

  // Fetch live patient leads from /api/bot/leads
  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/bot/leads');
      const data = await res.json();
      if (data.success && data.patients) {
        setPatients(data.patients);
      }
    } catch (e) {
      console.error('Failed to fetch patient directory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute Top Summary Counts
  const totalCount = patients.length;
  const healthyCount = patients.filter((p) => p.clinicalStatus === 'Healthy').length;
  const reviewCount = patients.filter((p) => p.clinicalStatus === 'Doctor Review').length;
  const leadCount = patients.filter((p) => p.clinicalStatus === 'Lead').length;

  // Dynamically extract unique states for State Filter dropdown
  const uniqueStates = Array.from(
    new Set(patients.map((p) => p.area).filter((area) => area && area !== '—'))
  ).sort();

  // Filter patients based on Search, Status, State, and Marketing Channel
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.phoneNumber.toLowerCase().includes(term) ||
      p.area.toLowerCase().includes(term) ||
      (p.attribution?.campaign && p.attribution.campaign.toLowerCase().includes(term)) ||
      (p.attribution?.source && p.attribution.source.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'all' || p.clinicalStatus.toLowerCase() === statusFilter.toLowerCase();

    const matchesState =
      stateFilter === 'all' || p.area.toLowerCase() === stateFilter.toLowerCase();

    const matchesChannel =
      channelFilter === 'all' ||
      (p.attribution?.source && p.attribution.source.toLowerCase().includes(channelFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesState && matchesChannel;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto custom-scrollbar">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Patient Leads & CRM</h2>
          <p className="text-on-surface-variant font-body-sm text-xs mt-1">
            Real-time patient intake directory with healthcare triage and marketing attribution.
          </p>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Patients */}
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-secondary transition-all">
          <div className="p-3 bg-secondary/10 text-secondary rounded-lg">
            <span className="material-symbols-outlined text-2xl">people</span>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant uppercase font-bold block tracking-wider">Total Leads</span>
            <span id="crm-stat-total" className="text-xl font-bold text-on-surface">
              {totalCount}
            </span>
          </div>
        </div>

        {/* Card 2: Healthy Status */}
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-green-500 transition-all">
          <div className="p-3 bg-green-500/10 text-green-600 rounded-lg">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant uppercase font-bold block tracking-wider">Healthy / Approved</span>
            <span id="crm-stat-healthy" className="text-xl font-bold text-green-600">
              {healthyCount}
            </span>
          </div>
        </div>

        {/* Card 3: Doctor Review */}
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-amber-500 transition-all">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg">
            <span className="material-symbols-outlined text-2xl">rate_review</span>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant uppercase font-bold block tracking-wider">Doctor Review</span>
            <span id="crm-stat-review" className="text-xl font-bold text-amber-600">
              {reviewCount}
            </span>
          </div>
        </div>

        {/* Card 4: New Leads */}
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:border-blue-500 transition-all">
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined text-2xl">pending</span>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant uppercase font-bold block tracking-wider">New Leads</span>
            <span id="crm-stat-leads" className="text-xl font-bold text-blue-600">
              {leadCount}
            </span>
          </div>
        </div>
      </div>

      {/* CRM Toolbar: Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="relative w-full md:w-80">
          <input
            id="crm-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, UTM campaign..."
            className="w-full bg-surface border border-outline-variant/40 rounded-xl py-2.5 pl-10 pr-4 focus:border-secondary transition-all outline-none font-body-md text-sm text-on-surface"
          />
          <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-sm">
            search
          </span>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          {/* Channel Filter */}
          <select
            id="crm-filter-channel"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 rounded-xl py-2.5 px-4 text-xs font-semibold text-on-surface-variant outline-none focus:border-secondary transition-all cursor-pointer"
          >
            <option value="all">All Ad Channels</option>
            <option value="meta">Meta / Instagram Ads</option>
            <option value="google">Google Ads</option>
            <option value="whatsapp">WhatsApp Promo</option>
            <option value="direct">Direct / Organic</option>
          </select>

          {/* Status Filter */}
          <select
            id="crm-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 rounded-xl py-2.5 px-4 text-xs font-semibold text-on-surface-variant outline-none focus:border-secondary transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Healthy">Healthy / Approved</option>
            <option value="Doctor Review">Doctor Review</option>
            <option value="Lead">New Leads</option>
          </select>

          {/* State Filter */}
          <select
            id="crm-filter-state"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-surface border border-outline-variant/40 rounded-xl py-2.5 px-4 text-xs font-semibold text-on-surface-variant outline-none focus:border-secondary transition-all cursor-pointer"
          >
            <option value="all">All States</option>
            {uniqueStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CRM Table Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,26,63,0.05)] border border-outline-variant/30 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-360px)] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/50 sticky top-0 backdrop-blur-md z-10">
              <tr className="border-b border-outline-variant/30">
                <th className="px-6 py-4 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-4 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Acquisition Source</th>
                <th className="px-6 py-4 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Clinical Status</th>
                <th className="px-6 py-4 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Order History</th>
                <th className="px-6 py-4 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">State</th>
                <th className="px-6 py-4 font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20" id="leads-body">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-on-surface-variant">
                    Loading patient directory...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-on-surface-variant">
                    No patient records matching filter.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const initial = (patient.name || 'P').charAt(0).toUpperCase();
                  const isHealthy = patient.clinicalStatus === 'Healthy';
                  const isReview = patient.clinicalStatus === 'Doctor Review';

                  const badgeClass = isHealthy
                    ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                    : isReview
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-600 border border-blue-500/30';

                  const attrBadge = formatAttributionBadge(patient.attribution);

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary font-bold text-xs flex items-center justify-center">
                            {initial}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-on-surface group-hover:text-secondary transition-colors block">
                              {patient.name}
                            </span>
                            <span className="text-[10px] text-on-surface-variant/70 font-mono">
                              {patient.email || 'No email provided'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-on-surface block">{patient.phoneNumber}</span>
                        <span className="text-[10px] text-on-surface-variant/60 font-mono">{patient.whatsappJid}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${attrBadge.badgeClass}`}>
                          {attrBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeClass}`}>
                          {patient.clinicalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-on-surface">
                          {patient.orderCount > 0 ? `${patient.orderCount} order${patient.orderCount > 1 ? 's' : ''} placed` : 'No orders yet'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-on-surface-variant">{patient.area}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-on-surface-variant">
                          {new Date(patient.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                <div id="drawer-avatar" className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm shadow-sm">
                  {(selectedPatient.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 id="drawer-name" className="font-bold text-on-surface text-base">
                    {selectedPatient.name}
                  </h4>
                  <p id="drawer-phone" className="text-xs text-on-surface-variant">
                    {selectedPatient.phoneNumber}
                  </p>
                </div>
              </div>
              <button
                id="close-drawer-btn"
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-surface-container-low rounded-xl transition-all cursor-pointer"
                title="Close details"
              >
                <span className="material-symbols-outlined text-xl text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Drawer Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Quick Status & State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Status</span>
                  <span
                    id="drawer-status"
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedPatient.clinicalStatus === 'Healthy'
                        ? 'bg-green-500/10 text-green-600'
                        : selectedPatient.clinicalStatus === 'Doctor Review'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-blue-500/10 text-blue-600'
                    }`}
                  >
                    {selectedPatient.clinicalStatus}
                  </span>
                </div>
                <div className="p-3 bg-surface border border-outline-variant/30 rounded-xl">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">State</span>
                  <span id="drawer-state" className="text-xs font-bold text-on-surface">
                    {selectedPatient.area}
                  </span>
                </div>
              </div>

              {/* Marketing & Attribution Card */}
              <div className="p-4 bg-surface rounded-xl border border-secondary/30 space-y-2">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">campaign</span>
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Marketing Attribution
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-secondary font-bold">First-Touch</span>
                </div>
                {selectedPatient.attribution ? (
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-on-surface-variant/70 block">Source:</span>
                      <span className="font-semibold text-on-surface capitalize">{selectedPatient.attribution.source}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant/70 block">Medium:</span>
                      <span className="font-semibold text-on-surface capitalize">{selectedPatient.attribution.medium}</span>
                    </div>
                    {selectedPatient.attribution.campaign && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-on-surface-variant/70 block">Campaign:</span>
                        <span className="font-mono text-secondary font-bold">{selectedPatient.attribution.campaign}</span>
                      </div>
                    )}
                    {selectedPatient.attribution.fbclid && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-on-surface-variant/70 block">Meta Click ID (fbclid):</span>
                        <span className="font-mono text-[10px] text-on-surface-variant truncate block max-w-xs">{selectedPatient.attribution.fbclid}</span>
                      </div>
                    )}
                    {selectedPatient.attribution.gclid && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-on-surface-variant/70 block">Google Click ID (gclid):</span>
                        <span className="font-mono text-[10px] text-on-surface-variant truncate block max-w-xs">{selectedPatient.attribution.gclid}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant/70 italic py-1">
                    Direct visit / Organic navigation (No ad parameters detected).
                  </p>
                )}
              </div>

              {/* Medical Profile Details */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 pb-1">
                  Medical Profile
                </h5>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-on-surface-variant/75 block">Age/DOB:</span>
                    <span id="drawer-dob" className="font-semibold text-on-surface">
                      {selectedPatient.dateOfBirth
                        ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/75 block">Gender:</span>
                    <span id="drawer-gender" className="font-semibold text-on-surface">
                      {selectedPatient.gender}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/75 block">Height:</span>
                    <span id="drawer-height" className="font-semibold text-on-surface">
                      {selectedPatient.height ? `${selectedPatient.height} cm` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/75 block">Weight:</span>
                    <span id="drawer-weight" className="font-semibold text-on-surface">
                      {selectedPatient.weight ? `${selectedPatient.weight} kg` : '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-on-surface-variant/75 block">Goal Weight:</span>
                    <span id="drawer-goal" className="font-semibold text-on-surface">
                      {selectedPatient.goalWeight ? `${selectedPatient.goalWeight} kg` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conditions & History */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 pb-1">
                  Clinical Intake Form
                </h5>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-on-surface-variant/75 font-semibold block">Allergies:</span>
                    <p id="drawer-allergies" className="text-on-surface italic p-2 bg-surface rounded-lg border border-outline-variant/20 mt-1">
                      {selectedPatient.healthData?.allergies || 'None reported'}
                    </p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/75 font-semibold block">Medical Conditions:</span>
                    <p id="drawer-conditions" className="text-on-surface italic p-2 bg-surface rounded-lg border border-outline-variant/20 mt-1">
                      {selectedPatient.healthData?.conditions || 'None reported'}
                    </p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant/75 font-semibold block">Current Medication:</span>
                    <p id="drawer-meds" className="text-on-surface italic p-2 bg-surface rounded-lg border border-outline-variant/20 mt-1">
                      {selectedPatient.healthData?.medications || 'None reported'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/20 pb-1">
                  Order History
                </h5>
                <div id="drawer-orders" className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-xs">
                  {selectedPatient.orders && selectedPatient.orders.length > 0 ? (
                    selectedPatient.orders.map((order) => (
                      <div key={order.id} className="p-3 bg-surface rounded-xl border border-outline-variant/20 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-on-surface">{order.productName}</p>
                          <p className="text-[10px] text-on-surface-variant/70 font-mono">
                            {order.paymentMethod} • {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-bold text-secondary text-sm">₹{order.price}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-on-surface-variant/60 italic text-center py-2">No orders placed yet.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
