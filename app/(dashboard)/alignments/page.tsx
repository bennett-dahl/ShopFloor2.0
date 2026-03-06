"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { get } from "@/lib/api";
import { useCan } from "@/components/MeProvider";

type Vehicle = { _id: string; make?: string; model?: string; year?: number };
type Alignment = {
  _id: string;
  vehicle: Vehicle;
  workOrder?: {
    _id: string;
    workOrderNumber?: string;
    description?: string;
    customer?: { firstName?: string; lastName?: string };
    vehicle?: { make?: string; model?: string; year?: number };
  };
  template?: { make?: string; model?: string; year?: string; alignmentType?: string };
  alignmentType: string;
  alignmentDate: string;
};

export default function AlignmentsPage() {
  const can = useCan("alignments");
  const [alignments, setAlignments] = useState<Alignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ alignments: Alignment[] }>("/alignments?limit=100");
      setAlignments(res.alignments ?? []);
    } catch {
      setAlignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (s: string | undefined) =>
    s ? new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Advanced Alignments
        </h1>
        {can.create && (
          <Link
            href="/alignments/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            ➕ New Alignment
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading alignments...</p>
        </div>
      ) : alignments.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-4xl">📐</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No alignments yet
          </h3>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Record before/after alignment data from the Setup Wizard.
          </p>
          {can.create && (
            <Link
              href="/alignments/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              ➕ New Alignment
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          {alignments.map((a) => {
            const v = typeof a.vehicle === "object" ? a.vehicle : null;
            const vehicleLabel = v ? `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() : "—";
            const templateLabel = a.template && typeof a.template === "object"
              ? `${a.template.make ?? ""} ${a.template.model ?? ""} ${a.template.year ?? ""}`.trim()
              : "";
            return (
              <Link
                key={a._id}
                href={`/alignments/${a._id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 py-3 px-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700/50"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {vehicleLabel || "Unknown vehicle"}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(a.alignmentDate)} · {a.alignmentType}
                    {templateLabel ? ` · ${templateLabel}` : ""}
                    {a.workOrder && typeof a.workOrder === "object"
                      ? ` · ${a.workOrder.workOrderNumber ?? a.workOrder._id}${a.workOrder.customer ? ` · ${a.workOrder.customer.firstName ?? ""} ${a.workOrder.customer.lastName ?? ""}`.trim() : ""}${a.workOrder.vehicle ? ` · ${a.workOrder.vehicle.year ?? ""} ${a.workOrder.vehicle.make ?? ""} ${a.workOrder.vehicle.model ?? ""}`.trim() : ""}`
                      : ""}
                  </p>
                </div>
                <span className="text-zinc-500">View</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/alignments/templates"
          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          Manage alignment templates →
        </Link>
      </div>
    </div>
  );
}
