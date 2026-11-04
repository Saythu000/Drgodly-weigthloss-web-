"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DrGodlyLogo } from "@/components/DrGodlyLogo";
import { LoginButton } from "@/components/LoginButton";
import { authClient } from "@/lib/auth-client";

export default function AppHeader({ activePath = "" }: { activePath?: string }) {
  const { data: session } = authClient.useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About Us", href: "/#about-us" },
    { label: "Find a Doctor", href: "/directory" },
    { label: "Blogs", href: "/blogs" },
    { label: "Events", href: "/events" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-150 bg-white/80 backdrop-blur-md dark:border-zinc-900/80 dark:bg-black/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <DrGodlyLogo />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-semibold lg:flex">
          {navLinks.map((link) => {
            const isActive = activePath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-emerald-600 dark:hover:text-emerald-450 ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-zinc-650 dark:text-zinc-350"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {session && (
            <>
              <Link
                href="/onboarding"
                className={`transition-colors hover:text-emerald-600 dark:hover:text-emerald-450 ${
                  activePath === "/onboarding"
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-zinc-650 dark:text-zinc-350"
                }`}
              >
                Onboarding
              </Link>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-emerald-600 dark:hover:text-emerald-450 ${
                  activePath === "/dashboard"
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-zinc-650 dark:text-zinc-350"
                }`}
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Actions (Desktop & Tablet) */}
        <div className="hidden items-center gap-4 sm:flex">
          <ThemeToggle />
          <LoginButton />
          {!session && (
            <Link
              href="/intake"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile Toggle & Actions */}
        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          
          {/* Mobile Login Button (Sign in Only, hides email to fit) */}
          <div className="scale-90 origin-right">
            <LoginButton />
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Menu Overlay) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-100 bg-white/95 px-6 py-6 space-y-4 shadow-xl dark:border-zinc-900 dark:bg-zinc-950/95 backdrop-blur-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = activePath === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-bold block py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-450 ${
                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {session && (
              <>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-bold block py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-450 ${
                    activePath === "/onboarding" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Onboarding
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-bold block py-1.5 transition-colors hover:text-emerald-600 dark:hover:text-emerald-450 ${
                    activePath === "/dashboard" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}
            
            {/* Mobile Get Started CTA */}
            {!session && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <Link
                  href="/intake"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  Get Started (Intake Questionnaire)
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
