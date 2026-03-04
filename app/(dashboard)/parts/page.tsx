"use client";

import { useEffect, useState, useCallback } from "react";
import { get } from "@/lib/api";
import PartModal, { type Part } from "@/components/entity-modals/PartModal";

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (showDeactivated) params.set("includeInactive", "true");
      params.set("limit", "100");
      const res = await get<{ parts: Part[] }>(`/parts?${params}`);
      setParts(res.parts);
    } catch {
      setParts([]);
    } finally {
      setLoading(false);
    }
  }, [search, showDeactivated]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: Part) => {
    setEditing(p);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Parts
        </h1>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          ➕ Add Part
        </button>
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <input
          type="text"
          placeholder="Search parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        />
        <label className="flex cursor-pointer items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={showDeactivated}
            onClick={() => setShowDeactivated((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 ${
              showDeactivated ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                showDeactivated ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Show deactivated parts</span>
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading parts...</p>
        </div>
      ) : parts.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-4xl">⚙️</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No parts found
          </h3>
          <button
            type="button"
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            ➕ Add Part
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Part #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {parts.map((p) => (
                <tr key={p._id} className={p.isActive === false ? "bg-zinc-100/50 dark:bg-zinc-800/50" : undefined}>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                    {p.partNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                    <span className="inline-flex items-center gap-1.5">
                      {p.name}
                      {p.isActive === false && (
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-400">Inactive</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-400">
                    {p.category}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-zinc-700 dark:text-zinc-400">
                    {p.stockQuantity ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    ${(p.sellingPrice ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded bg-teal-100 px-2 py-1 text-sm text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PartModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={() => {
          load();
          closeModal();
        }}
        editPart={editing}
        onDeactivated={() => {
          load();
          closeModal();
        }}
      />
    </div>
  );
}
