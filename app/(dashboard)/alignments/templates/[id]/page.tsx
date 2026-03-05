"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { get, post, put } from "@/lib/api";
import AlignmentSnapshotForm from "@/components/AlignmentSnapshotForm";
import type { IAlignmentSnapshot } from "@/models/AlignmentSnapshot";

type Template = {
  _id: string;
  make: string;
  model: string;
  year: string;
  alignmentType: string;
  rideHeightReference?: string;
  target: IAlignmentSnapshot;
  rideHeightUnit?: "mm" | "in";
  trackWidthUnit?: "mm" | "in";
  notes?: string;
};
type Setting = { _id: string; name: string };

export default function AlignmentTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alignmentTypes, setAlignmentTypes] = useState<Setting[]>([]);
  const [rideHeightRefs, setRideHeightRefs] = useState<Setting[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [alignmentType, setAlignmentType] = useState("");
  const [rideHeightReference, setRideHeightReference] = useState("");
  const [target, setTarget] = useState<IAlignmentSnapshot>({});
  const [rideHeightUnit, setRideHeightUnit] = useState<"mm" | "in">("mm");
  const [trackWidthUnit, setTrackWidthUnit] = useState<"mm" | "in">("mm");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      get<{ settings: Setting[] }>("/settings?category=alignmentType").catch(() => ({ settings: [] })),
      get<{ settings: Setting[] }>("/settings?category=rideHeightReference").catch(() => ({ settings: [] })),
    ]).then(([atRes, rhRes]) => {
      setAlignmentTypes(atRes.settings ?? []);
      setRideHeightRefs(rhRes.settings ?? []);
    });
  }, []);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    get<Template>(`/alignment-templates/${id}`)
      .then((t) => {
        if (cancelled) return;
        setMake(t.make ?? "");
        setModel(t.model ?? "");
        setYear(t.year ?? "");
        setAlignmentType(t.alignmentType ?? "");
        setRideHeightReference(t.rideHeightReference ?? "");
        setTarget(t.target ?? {});
        setRideHeightUnit(t.rideHeightUnit ?? "mm");
        setTrackWidthUnit(t.trackWidthUnit ?? "mm");
        setNotes(t.notes ?? "");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await post("/alignment-templates", {
          make,
          model,
          year,
          alignmentType: alignmentType || "custom",
          rideHeightReference: rideHeightReference || undefined,
          target,
          rideHeightUnit,
          trackWidthUnit,
          notes: notes || undefined,
        });
        router.push("/alignments/templates");
      } else {
        await put(`/alignment-templates/${id}`, {
          make,
          model,
          year,
          alignmentType: alignmentType || "custom",
          rideHeightReference: rideHeightReference || undefined,
          target,
          rideHeightUnit,
          trackWidthUnit,
          notes: notes || undefined,
        });
        router.push("/alignments/templates");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400";
  const selectClass =
    "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100";

  if (loading && !isNew) {
    return (
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-4xl">
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/alignments/templates"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Templates
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {isNew ? "New Template" : "Edit Template"}
        </h1>
      </div>

      <form onSubmit={save} className="space-y-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Vehicle & type</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. Porsche"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. 911 (992)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={inputClass}
                placeholder="e.g. 2021 or leave blank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Alignment type</label>
              <select
                value={alignmentType}
                onChange={(e) => setAlignmentType(e.target.value)}
                className={selectClass}
              >
                <option value="">Select</option>
                {alignmentTypes.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ride height reference</label>
              <select
                value={rideHeightReference}
                onChange={(e) => setRideHeightReference(e.target.value)}
                className={selectClass}
              >
                <option value="">None</option>
                {rideHeightRefs.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ride height unit</label>
                <select
                  value={rideHeightUnit}
                  onChange={(e) => setRideHeightUnit(e.target.value as "mm" | "in")}
                  className={selectClass}
                >
                  <option value="mm">mm</option>
                  <option value="in">in</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Track width unit</label>
                <select
                  value={trackWidthUnit}
                  onChange={(e) => setTrackWidthUnit(e.target.value as "mm" | "in")}
                  className={selectClass}
                >
                  <option value="mm">mm</option>
                  <option value="in">in</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <AlignmentSnapshotForm
            label="Target values"
            value={target}
            onChange={setTarget}
            rideHeightUnit={rideHeightUnit}
            trackWidthUnit={trackWidthUnit}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Link
            href="/alignments/templates"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isNew ? "Create Template" : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
