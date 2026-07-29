'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [headerStatusText, setHeaderStatusText] = useState('Awaiting Pairing...');
  const [headerDotColor, setHeaderDotColor] = useState('bg-error');
  const [headerPillClass, setHeaderPillClass] = useState(
    'bg-secondary-container/20 text-secondary border-secondary/20'
  );

  const navItems = [
    { id: 'nav-overview', label: 'Overview', path: '/dashboard', icon: 'dashboard' },
    { id: 'nav-customers', label: 'Customer CRM', path: '/dashboard/leads', icon: 'groups' },
    { id: 'nav-pipelines', label: 'Patient Pipeline', path: '/dashboard/pipelines', icon: 'view_kanban' },
    { id: 'nav-chat', label: 'WhatsApp Live Chat', path: '/dashboard/inbox', icon: 'chat' },
    { id: 'nav-broadcast', label: 'Broadcast Center', path: '/dashboard/broadcast', icon: 'campaign' },
    { id: 'nav-templates', label: 'Message Templates', path: '/dashboard/templates', icon: 'dashboard_customize' },
    { id: 'nav-marketing', label: 'Digital Marketing', path: '/dashboard/marketing', icon: 'post_add' },
    { id: 'nav-preferences', label: 'Settings', path: '/dashboard/settings', icon: 'settings' },
  ];

  const currentTabName = navItems.find((n) => pathname === n.path || (n.path !== '/dashboard' && pathname.startsWith(n.path)))?.label || 'Overview';

  // Poll /api/bot/status to keep top-right header status pill dynamically updated
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/bot/status');
        const data = await res.json();
        if (data.success) {
          if (data.status === 'connected') {
            setHeaderDotColor('bg-emerald-500');
            setHeaderStatusText(data.phoneNumber ? `WhatsApp Connected (+${data.phoneNumber})` : 'WhatsApp Connected');
            setHeaderPillClass('bg-emerald-500/10 text-emerald-700 border-emerald-500/20');
          } else if (data.status === 'pairing' || data.status === 'awaitingPair') {
            setHeaderDotColor('bg-amber-500');
            setHeaderStatusText('Awaiting Pairing...');
            setHeaderPillClass('bg-amber-500/10 text-amber-700 border-amber-500/20');
          } else {
            setHeaderDotColor('bg-error');
            setHeaderStatusText('Gateway Disconnected');
            setHeaderPillClass('bg-red-500/10 text-red-700 border-red-500/20');
          }
        }
      } catch (e) {}
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Side Navigation Bar matching ForgeChat collapsible style */}
      <aside
        className={`fixed left-0 top-0 h-full bg-primary-container shadow-xl flex flex-col py-6 z-50 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-[224px]'
        }`}
      >
        <div className={`px-4 mb-8 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div>
              <h1 id="dealer-name" className="font-headline-sm text-base font-bold text-surface-container-lowest">
                DrGodly Clinic
              </h1>
              <p className="text-on-primary-container font-label-sm text-[10px] uppercase tracking-widest mt-0.5 opacity-70">
                Telehealth CRM
              </p>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-xl bg-secondary-fixed flex items-center justify-center text-primary-container font-extrabold text-xs">
              DG
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.id}
                id={item.id}
                href={item.path}
                title={collapsed ? item.label : ''}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer ${
                  collapsed ? 'justify-center' : 'justify-start'
                } ${
                  isActive
                    ? 'bg-secondary text-white font-bold shadow-sm'
                    : 'text-surface-variant/80 hover:bg-white/10 hover:text-white font-medium'
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg shrink-0"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="text-xs truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Collapse Toggle */}
        <div className="px-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-surface-variant/70 hover:bg-white/10 hover:text-white transition-all text-xs font-bold cursor-pointer ${
              collapsed ? 'justify-center' : 'justify-start'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-lg">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`h-screen flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[224px]'}`}>
        {/* TopNavBar */}
        <header className="h-16 flex justify-between items-center px-8 bg-surface-bright border-b border-outline-variant shadow-sm z-40 shrink-0">
          <div className="flex items-center gap-6 flex-1">
            <h2 id="current-tab-title" className="font-headline-md text-base font-bold text-on-surface">
              {currentTabName}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${headerPillClass}`}>
              <span id="status-dot" className={`w-2 h-2 rounded-full ${headerDotColor} animate-pulse`}></span>
              <span id="status-text" className="font-label-sm text-xs font-semibold">
                {headerStatusText}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Section Container */}
        <div className="flex-1 overflow-y-auto bg-surface relative min-h-0 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
