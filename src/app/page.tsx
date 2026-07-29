'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = '/dashboard';
        return;
      } else {
        setErrorMsg(data.error || 'Invalid Admin email or password');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">DrGodly Telehealth</h1>
          <p className="text-xs text-on-surface-variant/70 mt-1">Weight Loss Clinic Staff Dashboard</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl flex items-center gap-3 text-error text-xs font-semibold animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-sm shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Staff Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-high border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-secondary transition-all"
              placeholder="admin@drgodly.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-high border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:border-secondary transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 mt-6 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
          <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest block font-mono">
            Encrypted HIPAA-Compliant Gateway v3.7.7
          </span>
        </div>
      </div>
    </div>
  );
}
