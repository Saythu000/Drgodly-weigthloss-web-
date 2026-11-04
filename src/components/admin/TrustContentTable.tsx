"use client";

import React, { useState } from "react";
import { Star, TrendingUp, Edit2, Trash2, Loader2, CheckCircle2, XCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustContentForm } from "./TrustContentForm";
import { motion, AnimatePresence } from "framer-motion";

interface TrustItem {
  id: string;
  type: string;
  title: string;
  description: string;
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

export function TrustContentTable({ initialItems }: { initialItems: TrustItem[] }) {
  const [items, setItems] = useState<TrustItem[]>(initialItems);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrustItem | null>(null);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/trust-content/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: !currentStatus } : item))
        );
      }
    } catch (error) {
      console.error("Failed to toggle status", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/trust-content/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete item", error);
    } finally {
      setDeletingId(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSuccess = (data: any) => {
    if (editingItem) {
      setItems((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    } else {
      setItems((prev) => [data, ...prev]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Trust Content</h1>
          <p className="text-zinc-500 text-sm">Manage testimonials and clinical statistics.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add New Content
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-500">Type</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-500">Title</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-500">Description</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-500 text-center">Status</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 capitalize">
                      {item.type === "testimonial" ? (
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{item.title}</td>
                  <td className="max-w-md truncate px-6 py-4 text-zinc-500">{item.description}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        disabled={togglingId === item.id}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black transition-all",
                          item.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
                          togglingId === item.id && "opacity-50"
                        )}
                      >
                        {togglingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : item.isActive ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {item.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-3 text-zinc-400">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setIsFormOpen(true);
                        }}
                        className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No trust content found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900"
            >
              <TrustContentForm 
                initialData={editingItem}
                onSuccess={handleFormSuccess}
                onCancel={() => setIsFormOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

