"use client";

import React, { useState, useEffect, useRef } from "react";
import { IntakeStep } from "@/lib/intake-state";
import { getStepMetadata, Message } from "@/lib/chat-utils";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DrGodlyLogo } from "@/components/DrGodlyLogo";

import { LoginButton } from "@/components/LoginButton";

import { TrustContent } from "@/lib/trust-data";

import { useRouter } from "next/navigation";
import { getCountryDisplayName, RegionConfig } from "@/lib/region-config";

export default function ChatIntake() {
  const router = useRouter();

  return (
    <ChatIntakeComponent
      onComplete={() => {
        router.push("/results");
      }}
    />
  );
}

export function ChatIntakeComponent({ onComplete }: { onComplete: (result: unknown) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<IntakeStep | null>(null);
  const [trustContent, setTrustContent] = useState<TrustContent[]>([]);
  const [region, setRegion] = useState<RegionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState<unknown>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialState();
  }, []);

  useEffect(() => {
    const scrollToLatestMessage = () => {
      messagesEndRef.current?.scrollIntoView({ block: "end" });
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };

    const animationFrame = requestAnimationFrame(scrollToLatestMessage);
    const timeout = window.setTimeout(scrollToLatestMessage, 250);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
    };
  }, [messages, isSubmitting]);

  const fetchInitialState = async () => {
    setIsLoading(true);
    console.log("ChatIntake - Fetching initial state...");
    try {
      // Fetch intake state (which includes region)
      const stateRes = await fetch("/api/intake");
      if (!stateRes.ok) {
        const errorText = await stateRes.text();
        throw new Error(`Failed to load intake state: ${stateRes.status} ${errorText}`);
      }
      
      const data = await stateRes.json();
      console.log("ChatIntake - Received intake data:", data);
      
      const regionData: RegionConfig = data.region || { country: "US", currency: "USD", system: "imperial", locale: "en-US" };
      setRegion(regionData);
      
      // Fetch trust content second (non-critical)
      let trustData = [];
      try {
        const trustRes = await fetch("/api/trust");
        if (trustRes.ok) {
          trustData = await trustRes.json();
        }
      } catch (trustError) {
        console.warn("ChatIntake - Trust fetch failed (continuing anyway):", trustError);
      }
      
      setCurrentStep(data.currentStep);
      setTrustContent(trustData);
      
      const welcomeMsg: Message = {
        id: "welcome",
        role: "assistant",
        content: `Welcome to DrGodly. We've detected you are in ${getCountryDisplayName(regionData.country)}. This guided intake checks your initial eligibility for weight-loss treatment. Let's start with some basic information.`,
      };
      
      const step = data.currentStep || IntakeStep.HEIGHT;
      const nextQ = getStepMetadata(step, regionData);
      
      if (!nextQ) {
        console.error("ChatIntake - Question metadata not found for step:", step);
        throw new Error(`Invalid step: ${step}`);
      }

      const questionMsg: Message = {
        id: `question-${step}`,
        role: "assistant",
        content: nextQ.question,
      };

      setMessages([welcomeMsg, questionMsg]);
      console.log("ChatIntake - Successfully initialized messages.");
    } catch (error) {
      console.error("ChatIntake - Initialization error:", error);
      setMessages([{
        id: "error",
        role: "assistant",
        content: `I'm having trouble connecting: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh or check your console.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildTrustMessage = (data: { data?: { weight?: number; goalWeight?: number } }) => {
    const stat = trustContent.find(t => t.type === "stat");
    const test = trustContent.find(t => t.type === "testimonial");
    const currentWeight = data.data?.weight;
    const goalWeight = data.data?.goalWeight;
    
    const unit = region?.system === "imperial" ? "lbs" : "kg";

    const weightContext =
      typeof currentWeight === "number" && typeof goalWeight === "number"
        ? `You told us your current weight is ${currentWeight}${unit} and your goal weight is ${goalWeight}${unit}.`
        : "You are building a profile we can use for a more relevant treatment recommendation.";
    const trustContext =
      stat?.description ||
      "Many members begin seeing weight changes within the first few months of a treatment plan.";
    const testimonialContext = test
      ? ` One member, ${test.metadata?.author || "a DrGodly member"}, shared: "${test.description}"`
      : "";

    return `${weightContext} ${trustContext}${testimonialContext}`;
  };

  const handleSubmit = async (e?: React.FormEvent, answerOverride?: unknown) => {
    if (e) e.preventDefault();
    const answer = answerOverride ?? inputValue;
    if (!currentStep || answer === "" || isSubmitting || !region) return;

    setIsSubmitting(true);
    const stepMeta = getStepMetadata(currentStep, region);
    
    // Add user message
    let displayValue = answer;
    if (stepMeta.type === "options") {
      displayValue = stepMeta.options?.find(o => o.value === answer)?.label || answer;
    } else if (stepMeta.type === "checkbox") {
      displayValue = Array.isArray(answer) ? answer.join(", ") : answer;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: String(displayValue),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/intake/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep, answer }),
      });
      const data = await res.json();

      if (data.success) {
        const nextStep = data.nextStep;
        const completedStep = currentStep;
        setCurrentStep(nextStep);
        setInputValue("");

        if (nextStep !== IntakeStep.COMPLETED) {
          setTimeout(() => {
            // Midway Trust Break
            if (completedStep === IntakeStep.DATE_OF_BIRTH) {
              const trustMsg: Message = {
                id: `trust-${Date.now()}`,
                role: "assistant",
                content: buildTrustMessage(data),
              };
              setMessages((prev) => [...prev, trustMsg]);
              
              setTimeout(() => {
                const nextQ = getStepMetadata(nextStep, region);
                const assistantMsg: Message = {
                  id: `question-${nextStep}`,
                  role: "assistant",
                  content: nextQ.question,
                };
                setMessages((prev) => [...prev, assistantMsg]);
              }, 2000);
            } else {
              const nextQ = getStepMetadata(nextStep, region);
              const assistantMsg: Message = {
                id: `question-${nextStep}`,
                role: "assistant",
                content: nextQ.question,
              };
              setMessages((prev) => [...prev, assistantMsg]);
            }
          }, 600);
        } else {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: "completed",
                role: "assistant",
                content: "Thank you! Your intake is complete. We are reviewing your information.",
              },
            ]);
            // Redirect to results after a short delay
            setTimeout(() => onComplete(data), 1500);
          }, 600);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "I'm sorry, that doesn't seem right. Could you please check your answer?",
          },
        ]);
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = () => {
    if (!currentStep || currentStep === IntakeStep.COMPLETED || !region) return null;
    const meta = getStepMetadata(currentStep, region);

    switch (meta.type) {
      case "number":
        return (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="number"
              value={inputValue as string}
              onChange={(e) => setInputValue(Number(e.target.value))}
              placeholder={meta.placeholder}
              autoFocus
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputValue}
              className="flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        );

      case "options":
        return (
          <div className="flex flex-wrap gap-2">
            {meta.options?.map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => {
                  setInputValue(opt.value);
                  handleSubmit(undefined, opt.value);
                }}
                disabled={isSubmitting}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-100"
              >
                {opt.label}
              </button>
            ))}
          </div>
        );

      case "checkbox":
        const currentVals = Array.isArray(inputValue) ? inputValue : [];
        return (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {meta.options?.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    const newVals = currentVals.includes(opt.value)
                      ? currentVals.filter((v) => v !== opt.value)
                      : [...currentVals, opt.value];
                    setInputValue(newVals);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    currentVals.includes(opt.value)
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={currentVals.length === 0 || isSubmitting}
              className="mt-2 w-full rounded-lg bg-zinc-900 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Continue
            </button>
          </div>
        );
      case "text":
        return (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue as string || ""}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={meta.placeholder}
              autoFocus
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputValue}
              className="flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        );

      case "date":
        return (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="date"
              value={inputValue as string}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputValue}
              className="flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  const resetIntake = async () => {
    if (!confirm("Are you sure you want to start over? This will clear your current progress.")) return;
    
    try {
      await fetch("/api/intake", { method: "DELETE" });
      setMessages([]);
      setCurrentStep(null);
      fetchInitialState();
    } catch (error) {
      console.error("Reset failed", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-900 sm:px-6">
        <DrGodlyLogo />
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <button 
            onClick={resetIntake}
            className="shrink-0 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Start Over
          </button>
          <Link href="/dashboard" className="shrink-0 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Dashboard</Link>
          <LoginButton />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col gap-2",
                  m.role === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-3 text-sm font-medium sm:max-w-[70%]",
                    m.role === "user"
                      ? "bg-zinc-900 text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  )}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-zinc-100 p-6 dark:border-zinc-900">
          <div className="mx-auto max-w-2xl">
            {renderInput()}
          </div>
        </div>
      </main>
    </div>
  );
}
