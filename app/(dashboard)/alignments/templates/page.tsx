"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { get } from "@/lib/api";
import { useCan } from "@/components/MeProvider";

type Template = {
  _id: string;
  make: string;
  model: string;
  year: string;
  alignmentType: string;
  rideHeightReference?: string;
};

export default function AlignmentTemplatesPage() {
  const can = useCan("alignmentTemplates");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<{ templates: Template[] }>("/alignment-templates?limit=100");
      setTemplates(res.templates ?? []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/alignments"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Alignments
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Alignment Templates
          </h1>
        </div>
        {can.create && (
        <Link
          href="/alignments/templates/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          ➕ New Template
        </Link>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-4xl">📐</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No templates yet
          </h3>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Create templates by make, model, year and alignment type for reuse.
          </p>
          {can.create && (
          <Link
            href="/alignments/templates/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            ➕ New Template
          </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          {templates.map((t) => (
            <Fragment key={t._id}>
              {can.update ? (
                <Link
                  href={`/alignments/templates/${t._id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 py-3 px-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700/50"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {t.make} {t.model} {t.year}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t.alignmentType}
                      {t.rideHeightReference ? ` · ${t.rideHeightReference}` : ""}
                    </p>
                  </div>
                  <span className="text-zinc-500">Edit</span>
                </Link>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 py-3 px-4 dark:border-zinc-700">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {t.make} {t.model} {t.year}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {t.alignmentType}
                      {t.rideHeightReference ? ` · ${t.rideHeightReference}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
