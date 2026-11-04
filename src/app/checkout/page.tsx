"use client";

import React from "react";
import CheckoutView from "@/components/CheckoutView";
import { authClient } from "@/lib/auth-client";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { LoginButton } from "@/components/LoginButton";

export default function CheckoutPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 px-6 dark:bg-black">
        <div className="mx-auto max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Secure Checkout</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Create an account to save your medical profile and access your 1:1 physician guidance.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <SocialAuthButtons callbackURL="/checkout" />
            <div className="mt-6">
              <p className="mb-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Quick Sign Up
              </p>
              <LoginButton />
              <p className="mt-4 text-center text-[10px] text-zinc-400 leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy. Your data is protected by HIPAA.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-zinc-100 p-6 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <p className="text-sm font-bold">HIPAA Compliant & Secure</p>
            </div>
            <p className="text-xs text-zinc-500">
              We take your privacy seriously. Your medical information is encrypted and only shared with your assigned medical provider.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-6 py-4 flex justify-end">
        <LoginButton />
      </div>
      <CheckoutView />
    </div>
  );
}
