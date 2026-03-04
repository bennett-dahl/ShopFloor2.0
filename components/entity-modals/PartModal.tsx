"use client";

import { useState, useEffect } from "react";
import { post, put, del } from "@/lib/api";

const CATEGORIES = [
  "engine",
  "transmission",
  "suspension",
  "brakes",
  "exhaust",
  "interior",
  "exterior",
  "electrical",
  "other",
];

export type Part = {
  _id: string;
  partNumber: string;
  name: string;
  description?: string;
  category: string;
  cost: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStock?: number;
  isActive?: boolean;
};

const emptyForm = {
  partNumber: "",
  name: "",
  description: "",
  category: "other",
  cost: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  minimumStock: 0,
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (part: Part) => void;
  editPart?: Part | null;
  onDeactivated?: () => void;
};

export default function PartModal({ open, onClose, onSaved, editPart, onDeactivated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editPart) {
      setForm({
        partNumber: editPart.partNumber,
        name: editPart.name,
        description: editPart.description ?? "",
        category: editPart.category,
        cost: editPart.cost,
        sellingPrice: editPart.sellingPrice,
        stockQuantity: editPart.stockQuantity ?? 0,
        minimumStock: editPart.minimumStock ?? 0,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editPart]);

  const handleDeactivate = async () => {
    if (!editPart || !onDeactivated) return;
    if (!confirm("Deactivate this part? It will no longer appear in active lists.")) return;
    setDeactivating(true);
    try {
      await del(`/parts/${editPart._id}`);
      onDeactivated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async () => {
    if (!editPart || !onDeactivated) return;
    setActivating(true);
    try {
      const body = {
        ...form,
        cost: Number(form.cost),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity) || 0,
        minimumStock: Number(form.minimumStock) || 0,
        isActive: true,
      };
      const updated = await put<Part>(`/parts/${editPart._id}`, body);
      onSaved({ ...updated, _id: editPart._id });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to activate");
    } finally {
      setActivating(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        cost: Number(form.cost),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity) || 0,
        minimumStock: Number(form.minimumStock) || 0,
      };
      if (editPart) {
        const updated = await put<Part>(`/parts/${editPart._id}`, body);
        onSaved({ ...updated, _id: editPart._id });
      } else {
        const created = await post<Part>("/parts", body);
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
          {editPart ? "Edit Part" : "Add Part"}
        </h2>
        <form onSubmit={save} className="mt-4 flex flex-1 flex-col space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Part Number *
              </label>
              <input
                required
                value={form.partNumber}
                onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
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
              Description
            </label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Cost *
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={form.cost || ""}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Selling Price *
              </label>
              <input
                required
                type="number"
                step="0.01"
                value={form.sellingPrice || ""}
                onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Stock Qty
              </label>
              <input
                type="number"
                value={form.stockQuantity || ""}
                onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Min Stock
              </label>
              <input
                type="number"
                value={form.minimumStock || ""}
                onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <div className="flex gap-2">
              {editPart && onDeactivated && (
                editPart.isActive === false ? (
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={activating}
                    className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:bg-zinc-800 dark:text-green-300 dark:hover:bg-green-900/20 disabled:opacity-70"
                  >
                    {activating ? "Activating..." : "Activate"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-70"
                  >
                    {deactivating ? "Deactivating..." : "Deactivate"}
                  </button>
                )
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
                {saving ? "Saving..." : editPart ? "Update" : "Add Part"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
