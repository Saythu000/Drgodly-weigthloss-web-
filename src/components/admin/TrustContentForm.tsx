"use client";

import React, { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";

interface TrustContentFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

export function TrustContentForm({ initialData, onSuccess, onCancel }: TrustContentFormProps) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: initialData?.type || "testimonial",
    title: initialData?.title || "",
    description: initialData?.description || "",
    metadata: JSON.stringify(initialData?.metadata || {}, null, 2),
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic JSON validation for metadata
    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(formData.metadata);
    } catch {
      setError("Invalid JSON format in Metadata field");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      metadata: parsedMetadata,
    };

    try {
      const url = isEditing 
        ? `/api/admin/trust-content/${initialData.id}` 
        : "/api/admin/trust-content";
      
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(data);
        }, 1000);
      } else {
        setError(data.error || "Failed to save content");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{isEditing ? "Edit Content" : "Add New Content"}</h3>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div className="grid gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="testimonial">Testimonial</option>
            <option value="stat">Clinical Stat</option>
          </select>
        </div>

        {/* Title */}
        <div className="grid gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Title</label>
          <input
            required
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Clinical Success"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>

        {/* Description */}
        <div className="grid gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</label>
          <textarea
            required
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the stat or testimonial..."
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>

        {/* Metadata */}
        <div className="grid gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Metadata (JSON)</label>
          <textarea
            rows={4}
            value={formData.metadata}
            onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
            placeholder='{ "author": "John D.", "loss": "15kg" }'
            className="font-mono text-[10px] rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
          />
          <label htmlFor="isActive" className="text-sm font-medium">Active (Visible on site)</label>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-medium text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Content saved successfully!
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-bold transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Update Content" : "Create Content"}
          </button>
        </div>
      </form>
    </div>
  );
}
