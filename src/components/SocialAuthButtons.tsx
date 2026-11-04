"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export function SocialAuthButtons({ callbackURL }: { callbackURL?: string }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;

    if (error && typeof error === "object") {
      const errorRecord = error as Record<string, unknown>;
      const message = errorRecord.message;
      const code = errorRecord.code;
      const status = errorRecord.status;

      return [message, code, status ? `HTTP ${status}` : null]
        .filter(Boolean)
        .join(" - ");
    }

    return "";
  };

  const handleSignIn = async (provider: "google" | "apple") => {
    setLoading(provider);
    setAuthError(null);
    try {
      const result: any = await authClient.signIn.social(
        {
          provider,
          callbackURL: callbackURL || pathname || "/dashboard",
        },
        {
          onError: (ctx: any) => {
            const message = getErrorMessage(ctx.error) || `${provider} sign in failed.`;
            console.error(`${provider} sign in failed:`, ctx.error);
            setAuthError(message);
            alert(message);
          },
        }
      );

      if (result.error) {
        const message = getErrorMessage(result.error) || `${provider} sign in failed.`;
        console.error(`${provider} sign in failed:`, result.error);
        setAuthError(message);
        alert(message);
      }
    } catch (error) {
      const message = getErrorMessage(error) || `${provider} sign in failed. Please try again.`;
      console.error(`${provider} sign in failed:`, error);
      setAuthError(message);
      alert(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => handleSignIn("google")}
        disabled={!!loading}
        className="flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {loading === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </button>

      <button
        onClick={() => handleSignIn("apple")}
        disabled={!!loading}
        className="flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {loading === "apple" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.523-2.324-4.286-2.363-2.558-.208-3.087 1.078-4.004 1.078zm2.345-4.107c1.014-1.248 1.053-2.454.845-3.39-.845.039-1.819.507-2.417 1.208-.52.597-1.014 1.56-.819 2.467.923.078 1.884-.52 2.391-1.285z" />
          </svg>
        )}
        Continue with Apple
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-100 dark:border-zinc-800"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950">Or continue with email</span>
        </div>
      </div>

      {authError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {authError}
        </p>
      )}
    </div>
  );
}
