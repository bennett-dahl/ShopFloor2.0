"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { get, post, put } from "@/lib/api";
import AlignmentSnapshotForm from "@/components/AlignmentSnapshotForm";
import type { IAlignmentSnapshot } from "@/models/AlignmentSnapshot";
import { useCan } from "@/components/MeProvider";

type Vehicle = { _id: string; make: string; model: string; year: number; customer?: { _id: string } };
type WorkOrder = {
  _id: string;
  workOrderNumber?: string;
  description?: string;
  workOrderDate?: string;
  vehicle?: { make?: string; model?: string; year?: number };
  customer?: { firstName?: string; lastName?: string };
};
type Template = { _id: string; make: string; model: string; year: string; alignmentType: string };
type Setting = { _id: string; name: string };
type Alignment = {
  _id: string;
  vehicle: Vehicle;
  workOrder?: WorkOrder;
  template?: Template;
  alignmentType: string;
  rideHeightReference?: string;
  rideHeightUnit?: "mm" | "in";
  trackWidthUnit?: "mm" | "in";
  before: IAlignmentSnapshot;
  after: IAlignmentSnapshot;
  intermediateSteps?: { label?: string; snapshot: IAlignmentSnapshot }[];
  customerNotes?: string;
  technicianNotes?: string;
  accuracyRating?: number;
  customerRating?: number;
  alignmentDate: string;
};

const emptySnapshot: IAlignmentSnapshot = {};

function AlignmentDetailInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === "new";
  const vehicleIdParam = searchParams.get("vehicleId") ?? "";
  const workOrderIdParam = searchParams.get("workOrderId") ?? "";
  const canAlignments = useCan("alignments");
  const canTemplates = useCan("alignmentTemplates");
  const canEditAlignment = isNew ? canAlignments.create : canAlignments.update;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [alignmentTypes, setAlignmentTypes] = useState<Setting[]>([]);
  const [rideHeightRefs, setRideHeightRefs] = useState<Setting[]>([]);
  const [lastAlignment, setLastAlignment] = useState<Alignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [saveAsTemplateSource, setSaveAsTemplateSource] = useState<"before" | "after" | number>("after");
  const [saveAsTemplateMake, setSaveAsTemplateMake] = useState("");
  const [saveAsTemplateModel, setSaveAsTemplateModel] = useState("");
  const [saveAsTemplateYear, setSaveAsTemplateYear] = useState("");
  const [saveAsTemplateAlignmentType, setSaveAsTemplateAlignmentType] = useState("");
  const [saveAsTemplateNotes, setSaveAsTemplateNotes] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [vehicleId, setVehicleId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [alignmentType, setAlignmentType] = useState("");
  const [rideHeightReference, setRideHeightReference] = useState("");
  const [rideHeightUnit, setRideHeightUnit] = useState<"mm" | "in">("mm");
  const [trackWidthUnit, setTrackWidthUnit] = useState<"mm" | "in">("mm");
  const [before, setBefore] = useState<IAlignmentSnapshot>(emptySnapshot);
  const [after, setAfter] = useState<IAlignmentSnapshot>(emptySnapshot);
  const [intermediateSteps, setIntermediateSteps] = useState<{ label: string; snapshot: IAlignmentSnapshot }[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [accuracyRating, setAccuracyRating] = useState<number | "">("");
  const [customerRating, setCustomerRating] = useState<number | "">("");

  useEffect(() => {
    setVehicleId((prev) => (vehicleIdParam || prev));
    setWorkOrderId((prev) => (workOrderIdParam || prev));
  }, [vehicleIdParam, workOrderIdParam]);

  const loadOptions = useCallback(async () => {
    const [vRes, woRes, tRes, atRes, rhRes] = await Promise.all([
      get<{ vehicles: Vehicle[] }>("/vehicles?limit=500").catch(() => ({ vehicles: [] })),
      get<{ workOrders: WorkOrder[] }>("/workorders?limit=500").catch(() => ({ workOrders: [] })),
      get<{ templates: Template[] }>("/alignment-templates?limit=100").catch(() => ({ templates: [] })),
      get<{ settings: Setting[] }>("/settings?category=alignmentType").catch(() => ({ settings: [] })),
      get<{ settings: Setting[] }>("/settings?category=rideHeightReference").catch(() => ({ settings: [] })),
    ]);
    setVehicles(vRes.vehicles ?? []);
    setWorkOrders(woRes.workOrders ?? []);
    setTemplates(tRes.templates ?? []);
    setAlignmentTypes(atRes.settings ?? []);
    setRideHeightRefs(rhRes.settings ?? []);
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const loadLastAlignment = useCallback(async (vid: string) => {
    if (!vid) {
      setLastAlignment(null);
      return;
    }
    try {
      const res = await get<{ alignments: Alignment[] }>(`/alignments?vehicleId=${vid}&limit=1`);
      const list = res.alignments ?? [];
      setLastAlignment(list[0] ?? null);
    } catch {
      setLastAlignment(null);
    }
  }, []);

  useEffect(() => {
    loadLastAlignment(vehicleId);
  }, [vehicleId, loadLastAlignment]);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    get<Alignment>(`/alignments/${id}`)
      .then((a) => {
        if (cancelled) return;
        const v = a.vehicle as Vehicle;
        setVehicleId(v?._id ?? "");
        setWorkOrderId((a.workOrder as WorkOrder)?._id ?? "");
        setTemplateId((a.template as Template)?._id ?? "");
        setAlignmentType(a.alignmentType ?? "");
        setRideHeightReference(a.rideHeightReference ?? "");
        setRideHeightUnit(a.rideHeightUnit ?? "mm");
        setTrackWidthUnit(a.trackWidthUnit ?? "mm");
        setBefore(a.before ?? emptySnapshot);
        setAfter(a.after ?? emptySnapshot);
        setIntermediateSteps(
          (a.intermediateSteps ?? []).map((s) => ({ label: s.label ?? "", snapshot: s.snapshot ?? emptySnapshot }))
        );
        setCustomerNotes(a.customerNotes ?? "");
        setTechnicianNotes(a.technicianNotes ?? "");
        setAccuracyRating(a.accuracyRating ?? "");
        setCustomerRating(a.customerRating ?? "");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const addIntermediateStep = () => {
    setIntermediateSteps((prev) => [...prev, { label: "", snapshot: emptySnapshot }]);
  };

  const removeIntermediateStep = (i: number) => {
    setIntermediateSteps((prev) => prev.filter((_, idx) => idx !== i));
  };

  const buildBody = useCallback(
    () => ({
      vehicle: vehicleId,
      workOrder: workOrderId || undefined,
      template: templateId || undefined,
      alignmentType: alignmentType || "custom",
      rideHeightReference: rideHeightReference || undefined,
      rideHeightUnit,
      trackWidthUnit,
      before,
      after,
      intermediateSteps: intermediateSteps.map((s) => ({ label: s.label, snapshot: s.snapshot })),
      customerNotes: customerNotes || undefined,
      technicianNotes: technicianNotes || undefined,
      accuracyRating: accuracyRating !== "" ? accuracyRating : undefined,
      customerRating: customerRating !== "" ? customerRating : undefined,
    }),
    [
      vehicleId,
      workOrderId,
      templateId,
      alignmentType,
      rideHeightReference,
      rideHeightUnit,
      trackWidthUnit,
      before,
      after,
      intermediateSteps,
      customerNotes,
      technicianNotes,
      accuracyRating,
      customerRating,
    ]
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      alert("Please select a vehicle.");
      return;
    }
    setSaving(true);
    try {
      const body = buildBody();
      if (isNew) {
        const created = await post<Alignment>("/alignments", body);
        setLastSavedAt(new Date());
        router.replace(`/alignments/${(created as Alignment)._id}`);
      } else {
        await put(`/alignments/${id}`, body);
        setLastSavedAt(new Date());
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const bodyRef = useRef(buildBody());
  useEffect(() => {
    bodyRef.current = buildBody();
  }, [buildBody]);

  useEffect(() => {
    if (loading) return;
    const body = bodyRef.current;
    if (isNew && !body.vehicle) return;
    const hasData = body.vehicle && (Object.keys(body.before ?? {}).length > 0 || Object.keys(body.after ?? {}).length > 0 || body.customerNotes || body.technicianNotes);
    if (isNew && !hasData) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      const latest = bodyRef.current;
      if (isNew) {
        if (latest.vehicle) {
          setSaving(true);
          post("/alignments", latest)
            .then((created: unknown) => {
              setLastSavedAt(new Date());
              router.replace(`/alignments/${(created as { _id: string })._id}`);
            })
            .catch(() => {})
            .finally(() => setSaving(false));
        }
      } else {
        put(`/alignments/${id}`, latest)
          .then(() => setLastSavedAt(new Date()))
          .catch(() => {});
      }
    }, 2500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    loading,
    isNew,
    id,
    vehicleId,
    workOrderId,
    templateId,
    alignmentType,
    rideHeightReference,
    rideHeightUnit,
    trackWidthUnit,
    before,
    after,
    intermediateSteps,
    customerNotes,
    technicianNotes,
    accuracyRating,
    customerRating,
    router,
  ]);

  const inputClass =
    "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400";
  const selectClass =
    "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100";

  if (loading && !isNew) {
    return (
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-4xl">
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading alignment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/alignments"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isNew ? "New Alignment" : "Edit Alignment"}
          </h1>
        </div>
        {canTemplates.create && (
        <button
          type="button"
          onClick={() => {
            const v = vehicles.find((x) => x._id === vehicleId);
            setSaveAsTemplateMake(v?.make ?? "");
            setSaveAsTemplateModel(v?.model ?? "");
            setSaveAsTemplateYear(v?.year?.toString() ?? "");
            setSaveAsTemplateAlignmentType(alignmentType || "custom");
            setSaveAsTemplateNotes("");
            setSaveAsTemplateSource("after");
            setSaveAsTemplateOpen(true);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Save as template
        </button>
        )}
      </div>

      {saveAsTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSaveAsTemplateOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Save snapshot as template</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Create a template from a snapshot for this vehicle&apos;s make/model/year.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Source</label>
                <select
                  value={typeof saveAsTemplateSource === "number" ? `step-${saveAsTemplateSource}` : saveAsTemplateSource}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "before") setSaveAsTemplateSource("before");
                    else if (v === "after") setSaveAsTemplateSource("after");
                    else if (v.startsWith("step-")) setSaveAsTemplateSource(Number(v.replace("step-", "")));
                  }}
                  className={selectClass}
                >
                  <option value="before">Before</option>
                  <option value="after">After</option>
                  {intermediateSteps.map((_, i) => (
                    <option key={i} value={`step-${i}`}>Intermediate: {intermediateSteps[i].label || `Step ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Make</label>
                  <input value={saveAsTemplateMake} onChange={(e) => setSaveAsTemplateMake(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Model</label>
                  <input value={saveAsTemplateModel} onChange={(e) => setSaveAsTemplateModel(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Year</label>
                  <input value={saveAsTemplateYear} onChange={(e) => setSaveAsTemplateYear(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Alignment type</label>
                <input value={saveAsTemplateAlignmentType} onChange={(e) => setSaveAsTemplateAlignmentType(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes (optional)</label>
                <textarea value={saveAsTemplateNotes} onChange={(e) => setSaveAsTemplateNotes(e.target.value)} rows={2} className={inputClass} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setSaveAsTemplateOpen(false)} className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Cancel
              </button>
              <button
                type="button"
                disabled={savingTemplate || !saveAsTemplateMake.trim() || !saveAsTemplateModel.trim() || !saveAsTemplateAlignmentType.trim()}
                onClick={async () => {
                  const targetSnapshot =
                    saveAsTemplateSource === "before"
                      ? before
                      : saveAsTemplateSource === "after"
                        ? after
                        : intermediateSteps[saveAsTemplateSource]?.snapshot ?? emptySnapshot;
                  setSavingTemplate(true);
                  try {
                    await post("/alignment-templates", {
                      make: saveAsTemplateMake.trim(),
                      model: saveAsTemplateModel.trim(),
                      year: saveAsTemplateYear.trim() || undefined,
                      alignmentType: saveAsTemplateAlignmentType.trim(),
                      target: targetSnapshot,
                      notes: saveAsTemplateNotes.trim() || undefined,
                      rideHeightUnit,
                      trackWidthUnit,
                    });
                    setSaveAsTemplateOpen(false);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Failed to save template");
                  } finally {
                    setSavingTemplate(false);
                  }
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingTemplate ? "Saving…" : "Save template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {vehicleId && lastAlignment && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Last alignment for this vehicle
          </h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {new Date(lastAlignment.alignmentDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}{" "}
            · {lastAlignment.alignmentType}
          </p>
          <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">
            After snapshot: Total {lastAlignment.after?.totalWeightLbs ?? "—"} lbs
            {lastAlignment.after?.frontAxlePercent != null && ` · Front axle ${lastAlignment.after.frontAxlePercent}%`}
          </p>
        </div>
      )}

      {vehicleId && !lastAlignment && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No previous alignment for this vehicle.
          </p>
        </div>
      )}

      <form onSubmit={save} className="space-y-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Context</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Vehicle *</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.year} {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Work order</label>
              <select
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                className={selectClass}
              >
                <option value="">None</option>
                {workOrders.map((wo) => (
                  <option key={wo._id} value={wo._id}>
                    {[
                      wo.workOrderNumber ?? wo._id,
                      wo.customer ? `${wo.customer.firstName ?? ""} ${wo.customer.lastName ?? ""}`.trim() : "",
                      wo.vehicle ? `${wo.vehicle.year ?? ""} ${wo.vehicle.make ?? ""} ${wo.vehicle.model ?? ""}`.trim() : "",
                    ].filter(Boolean).join(" · ") || (wo.description ?? wo._id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Template</label>
              <select
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  const t = templates.find((x) => x._id === e.target.value);
                  if (t) setAlignmentType(t.alignmentType);
                }}
                className={selectClass}
              >
                <option value="">None</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.make} {t.model} {t.year} · {t.alignmentType}
                  </option>
                ))}
              </select>
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
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <AlignmentSnapshotForm
            label="Before"
            value={before}
            onChange={setBefore}
            rideHeightUnit={rideHeightUnit}
            trackWidthUnit={trackWidthUnit}
          />
        </div>

        {intermediateSteps.length > 0 && (
          <div className="space-y-4">
            {intermediateSteps.map((step, i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="mb-4 flex items-center justify-between">
                  <input
                    type="text"
                    value={step.label}
                    onChange={(e) =>
                      setIntermediateSteps((prev) => {
                        const next = [...prev];
                        next[i] = { ...next[i], label: e.target.value };
                        return next;
                      })}
                    placeholder="Step label (e.g. After ride height)"
                    className="max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  />
                  {canEditAlignment && (
                  <button
                    type="button"
                    onClick={() => removeIntermediateStep(i)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove
                  </button>
                  )}
                </div>
                <AlignmentSnapshotForm
                  value={step.snapshot}
                  onChange={(v) =>
                    setIntermediateSteps((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], snapshot: v };
                      return next;
                    })
                  }
                  rideHeightUnit={rideHeightUnit}
                  trackWidthUnit={trackWidthUnit}
                />
              </div>
            ))}
          </div>
        )}
        {canEditAlignment && (
        <button
          type="button"
          onClick={addIntermediateStep}
          className="rounded-lg border border-dashed border-zinc-400 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          + Add intermediate step
        </button>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <AlignmentSnapshotForm
            label="After"
            value={after}
            onChange={setAfter}
            rideHeightUnit={rideHeightUnit}
            trackWidthUnit={trackWidthUnit}
          />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Notes & ratings</h2>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Alignment accuracy (1–5)</label>
                <select
                  value={accuracyRating === "" ? "" : accuracyRating}
                  onChange={(e) => setAccuracyRating(e.target.value === "" ? "" : Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">How close to target</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer rating (1–5)</label>
                <select
                  value={customerRating === "" ? "" : customerRating}
                  onChange={(e) => setCustomerRating(e.target.value === "" ? "" : Number(e.target.value))}
                  className={selectClass}
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Meets customer expectations</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer notes (resulting feel)</label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Technician notes</label>
              <textarea
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {saving && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Saving…</span>
          )}
          {!saving && lastSavedAt && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Saved at {lastSavedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          {canEditAlignment && (
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              const e = { preventDefault: () => {} } as React.FormEvent;
              await save(e);
              router.push("/alignments");
            }}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50"
          >
            Save and Close
          </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function AlignmentDetailPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <AlignmentDetailInner />
    </Suspense>
  );
}
