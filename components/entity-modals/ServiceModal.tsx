"use client";

import { useState, useEffect } from "react";
import { post, put, del } from "@/lib/api";

const CATEGORIES = [
  "maintenance",
  "repair",
  "modification",
  "inspection",
  "diagnostic",
  "alignment",
  "exhaust",
  "engine",
  "transmission",
  "brakes",
  "suspension",
  "electrical",
  "other",
];

export type Service = {
  _id: string;
  serviceCode: string;
  name: string;
  description: string;
  category: string;
  standardHours: number;
  laborRate: number;
  totalCost: number;
};

const emptyForm = {
  serviceCode: "",
  name: "",
  description: "",
  category: "maintenance",
  standardHours: 0,
  laborRate: 0,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (service: Service) => void;
  editService?: Service | null;
  onDeleted?: () => void;
};

export default function ServiceModal({ open, onClose, onSaved, editService, onDeleted }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editService) {
      setForm({
        serviceCode: editService.serviceCode,
        name: editService.name,
        description: editService.description,
        category: editService.category,
        standardHours: editService.standardHours,
        laborRate: editService.laborRate,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editService]);

  const handleDelete = async () => {
    if (!editService || !onDeleted) return;
    if (!confirm("Delete this service? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await del(`/services/${editService._id}`);
      onDeleted();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const stdHours = Number(form.standardHours) || 0;
      const rate = Number(form.laborRate) || 0;
      const body = {
        ...form,
        standardHours: stdHours,
        laborRate: rate,
        totalCost: stdHours * rate,
      };
      if (editService) {
        const updated = await put<Service>(`/services/${editService._id}`, body);
        onSaved({ ...updated, _id: editService._id });
      } else {
        const created = await post<Service>("/services", body);
        onSaved(created);
      }
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white p-4 shadow-xl dark:bg-zinc-800 sm:max-h-[85vh] sm:max-w-lg sm:rounded-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {editService ? "Edit Service" : "Add Service"}
        </h2>
        <form onSubmit={save} className="mt-4 flex flex-1 flex-col space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Service Code *
              </label>
              <input
                required
                value={form.serviceCode}
                onChange={(e) => setForm({ ...form, serviceCode: e.target.value.toUpperCase() })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description *
            </label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Standard Hours *
              </label>
              <input
                required
                type="number"
                step="0.25"
                value={form.standardHours || ""}
                onChange={(e) => setForm({ ...form, standardHours: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Labor Rate *
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={form.laborRate || ""}
                onChange={(e) => setForm({ ...form, laborRate: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-500">
            Total = $
            {((Number(form.standardHours) || 0) * (Number(form.laborRate) || 0)).toFixed(2)}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <div className="flex gap-2">
              {editService && onDeleted && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-70"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-70"
              >
                {saving ? "Saving..." : editService ? "Update" : "Add Service"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
