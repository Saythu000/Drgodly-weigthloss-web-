"use client";

import React from "react";
import Link from "next/link";
import { Package, TrendingDown, Clock, ChevronRight } from "lucide-react";
import { RegionConfig } from "@/lib/region-config";
import { formatCurrency } from "@/lib/region-shared";

interface DashboardData {
  user: {
    email: string;
    name: string | null;
  };
  region: RegionConfig;
  currentPlan?: {
    drugType: string;
    tier: string;
    price: number;
    currency: string;
    durationMonths: number;
    status: string;
    createdAt: string;
  };
  orders: Array<{
    id: string;
    status: string;
    createdAt: string;
    plan: {
      drugType: string;
      tier: string;
      price: number;
      currency: string;
      durationMonths: number;
    };
  }>;
  intake?: {
    weight: number;
    goalWeight: number;
  };
}

export default function DashboardView({ data }: { data: DashboardData }) {
  const { currentPlan, orders, intake, region } = data;

  const unit = region.system === "imperial" ? "lbs" : "kg";

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-6 dark:bg-black">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back, {data.user.name || "User"}
          </h1>
          <p className="text-zinc-500">Here&apos;s an overview of your health journey.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Current Plan</h2>
                <Package className="h-5 w-5 text-zinc-400" />
              </div>

              {currentPlan ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-black capitalize text-zinc-900 dark:text-zinc-100">
                        {currentPlan.drugType}
                      </p>
                      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                        {currentPlan.tier} • {currentPlan.durationMonths} Month Program
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                      {currentPlan.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Clock className="h-4 w-4" />
                    Started on {new Date(currentPlan.createdAt).toLocaleDateString()}
                  </div>
                  <button className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
                    View Plan Details
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <p className="text-sm text-zinc-500">You don&apos;t have an active plan yet.</p>
                  <Link href="/" className="inline-block rounded-xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Order History */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-xl font-bold mb-6">Order History</h2>
              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-xl border border-zinc-50 p-4 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
                          <Package className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold capitalize">{order.plan.drugType} ({order.plan.durationMonths}mo)</p>
                          <p className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold">
                          {formatCurrency(order.plan.price, order.plan.currency, region.locale)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-zinc-300" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-4">No orders found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weight Tracking Placeholder */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Progress</h2>
                <TrendingDown className="h-5 w-5 text-green-500" />
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase">Current</p>
                    <p className="text-xl font-black">
                      {intake?.weight ? Math.round(region.system === "imperial" ? intake.weight * 2.20462 : intake.weight) : "--"}
                      {unit}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-400 uppercase">Goal</p>
                    <p className="text-xl font-black">
                      {intake?.goalWeight ? Math.round(region.system === "imperial" ? intake.goalWeight * 2.20462 : intake.goalWeight) : "--"}
                      {unit}
                    </p>
                  </div>
                </div>

                <div className="h-32 w-full rounded-xl bg-zinc-50 flex items-center justify-center dark:bg-zinc-800">
                  <p className="text-xs text-zinc-400 font-medium">Weight Chart Placeholder</p>
                </div>

                <button className="w-full rounded-xl border border-zinc-200 py-3 text-xs font-bold transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                  Log New Weight
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-bold mb-4">Support</h2>
              <div className="space-y-3">
                <button className="flex w-full items-center justify-between rounded-lg p-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  Message a Doctor
                  <ChevronRight className="h-4 w-4 text-zinc-300" />
                </button>
                <button className="flex w-full items-center justify-between rounded-lg p-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  Help Center
                  <ChevronRight className="h-4 w-4 text-zinc-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
