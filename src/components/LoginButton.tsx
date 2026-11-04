'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export function LoginButton() {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100"
    >
      <Lock className="h-3.5 w-3.5" />
      <span>Staff Login</span>
    </Link>
  );
}
