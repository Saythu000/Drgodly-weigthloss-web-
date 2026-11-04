"use client";

import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function WhatsAppWidget() {
  const pathname = usePathname();
  const [showTooltip, setShowTooltip] = useState(true);

  // Get WhatsApp number from environment or use default
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";
  const cleanNumber = whatsappNumber.replace(/\D/g, "");
  const defaultMessage = encodeURIComponent(
    "Hi DrGodly! I'd like to check my qualification for the doctor-guided weight loss program."
  );
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${defaultMessage}`;

  // Hide widget on dashboard or login pages
  if (pathname?.startsWith('/dashboard') || pathname === '/login') {
    return null;
  }

  return (
    <div
      style={{ zIndex: 99990 }}
      className="fixed bottom-6 left-6 flex items-center gap-3"
    >
      {/* Floating WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with DrGodly AI Intake Assistant"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-emerald-950/20 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-2xl hover:shadow-emerald-500/30"
      >
        {/* WhatsApp SVG Icon */}
        <svg
          className="h-8 w-8 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.489.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>

        {/* Pulse ring animation */}
        <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-[#25D366] opacity-30" />
      </a>

      {/* Pop-up Pill / Tooltip */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-4 py-2 text-xs font-semibold text-zinc-800 shadow-lg backdrop-blur-md dark:border-emerald-900/50 dark:bg-zinc-900/95 dark:text-zinc-200 animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="flex h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
          <span>Qualify via WhatsApp AI</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(false);
            }}
            className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Dismiss tooltip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
