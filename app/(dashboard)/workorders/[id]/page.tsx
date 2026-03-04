"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { get, post, put, del } from "@/lib/api";
import VehicleModal from "@/components/entity-modals/VehicleModal";
import PartModal from "@/components/entity-modals/PartModal";
import ServiceModal from "@/components/entity-modals/ServiceModal";

const WORK_TYPES = ["maintenance", "repair", "modification", "inspection", "diagnostic", "other"];
const STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];

type Customer = { _id: string; firstName: string; lastName: string; email?: string };
type Vehicle = {
  _id: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  customer: Customer;
  mileage?: number;
};
type Part = { _id: string; name: string; partNumber: string; sellingPrice: number };
type Service = { _id: string; name: string; serviceCode: string; totalCost: number };

type PartUsed = { part: string; quantity: number; unitPrice: number };
type ServiceUsed = { service: string; quantity: number; unitPrice: number };
type OtherWork = { description: string; quantity: number; unitPrice: number };

type WorkOrder = {
  _id: string;
  vehicle: Vehicle;
  customer: Customer;
  workType: string;
  description: string;
  status: string;
  workOrderDate: string;
  mileageAtService: number;
  laborHours?: number;
  laborRate?: number;
  totalCost?: number;
  partsUsed: Array<PartUsed & { part?: Part }>;
  servicesUsed: Array<ServiceUsed & { service?: Service }>;
  otherWork: OtherWork[];
  completedBy?: { name: string };
  notes?: string;
};

const emptyForm = {
  customer: "",
  vehicle: "",
  workType: "maintenance",
  description: "",
  status: "scheduled",
  workOrderDate: new Date().toISOString().slice(0, 10),
  mileageAtService: 0,
  laborHours: 0,
  laborRate: 0,
  partsUsed: [] as PartUsed[],
  servicesUsed: [] as ServiceUsed[],
  otherWork: [] as OtherWork[],
  notes: "",
};

function calcTotal(form: typeof emptyForm): number {
  let t = (form.laborHours || 0) * (form.laborRate || 0);
  form.partsUsed.forEach((p) => (t += (p.quantity || 0) * (p.unitPrice || 0)));
  form.servicesUsed.forEach((s) => (t += (s.quantity || 0) * (s.unitPrice || 0)));
  form.otherWork.forEach((w) => (t += (w.quantity || 0) * (w.unitPrice || 0)));
  return t;
}

function vehicleShortLabel(v: Vehicle) {
  return `${v.year} ${v.make} ${v.model}`;
}

const inputClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100";
const selectClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100";

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allowChangeCustomerVehicle, setAllowChangeCustomerVehicle] = useState(false);
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);
  const [addPartModalForRow, setAddPartModalForRow] = useState<number | null>(null);
  const [addServiceModalForRow, setAddServiceModalForRow] = useState<number | null>(null);

  const canChangeCustomerVehicle = isNew || allowChangeCustomerVehicle;

  const refetchCustomers = useCallback(async () => {
    const res = await get<{ customers: Customer[] }>("/customers?limit=500").catch(() => ({ customers: [] as Customer[] }));
    setCustomers(res.customers);
  }, []);

  const refetchVehiclesForCustomer = useCallback(async (customerId: string) => {
    if (!customerId) {
      setVehicles([]);
      return;
    }
    const res = await get<{ vehicles: Vehicle[] }>(`/vehicles?customerId=${customerId}&limit=500`).catch(() => ({ vehicles: [] as Vehicle[] }));
    setVehicles(res.vehicles);
  }, []);

  const refetchPartsAndServices = useCallback(async () => {
    const [p, s] = await Promise.all([
      get<{ parts: Part[] }>("/parts?limit=500").catch(() => ({ parts: [] as Part[] })),
      get<{ services: Service[] }>("/services?limit=500").catch(() => ({ services: [] as Service[] })),
    ]);
    setParts(p.parts);
    setServices(s.services);
  }, []);

  useEffect(() => {
    refetchCustomers();
    refetchPartsAndServices();
  }, [refetchCustomers, refetchPartsAndServices]);

  useEffect(() => {
    refetchVehiclesForCustomer(form.customer);
  }, [form.customer, refetchVehiclesForCustomer]);

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm);
      setLoading(false);
      return;
    }
    let cancelled = false;
    get<WorkOrder>(`/workorders/${id}`)
      .then((wo) => {
        if (cancelled) return;
        const v = wo.vehicle as Vehicle;
        const customerId = typeof wo.customer === "object" && wo.customer != null ? (wo.customer as Customer)._id : (wo as { customer: string }).customer;
        setForm({
          customer: customerId ?? "",
          vehicle: v._id,
          workType: wo.workType,
          description: wo.description,
          status: wo.status,
          workOrderDate: wo.workOrderDate?.slice(0, 10) ?? emptyForm.workOrderDate,
          mileageAtService: wo.mileageAtService ?? 0,
          laborHours: wo.laborHours ?? 0,
          laborRate: wo.laborRate ?? 0,
          partsUsed: (wo.partsUsed ?? []).map((p: PartUsed & { part?: Part }) => {
            const partId = typeof p.part === "object" && p.part != null ? (p.part as Part)._id : (p as { part: string }).part;
            return { part: partId, quantity: p.quantity ?? 1, unitPrice: p.unitPrice ?? 0 };
          }),
          servicesUsed: (wo.servicesUsed ?? []).map((s: ServiceUsed & { service?: Service }) => {
            const svcId = typeof s.service === "object" && s.service != null ? (s.service as Service)._id : (s as { service: string }).service;
            return { service: svcId, quantity: s.quantity ?? 1, unitPrice: s.unitPrice ?? 0 };
          }),
          otherWork: (wo.otherWork ?? []).map((w: OtherWork) => ({
            description: w.description ?? "",
            quantity: w.quantity ?? 1,
            unitPrice: w.unitPrice ?? 0,
          })),
          notes: wo.notes ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) router.replace("/workorders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew, router]);

  const onCustomerChange = (customerId: string) => {
    setForm((f) => ({
      ...f,
      customer: customerId,
      vehicle: "",
      mileageAtService: 0,
    }));
  };

  const onVehicleChange = (vehicleId: string) => {
    const v = vehicles.find((x) => x._id === vehicleId);
    setForm((f) => ({
      ...f,
      vehicle: vehicleId,
      mileageAtService: v?.mileage ?? f.mileageAtService,
    }));
  };

  const addPart = () => setForm((f) => ({ ...f, partsUsed: [...f.partsUsed, { part: "", quantity: 1, unitPrice: 0 }] }));
  const removePart = (i: number) => setForm((f) => ({ ...f, partsUsed: f.partsUsed.filter((_, j) => j !== i) }));
  const onPartSelect = (i: number, partId: string) => {
    const p = parts.find((x) => x._id === partId);
    setForm((f) => {
      const next = [...f.partsUsed];
      next[i] = { ...next[i], part: partId, unitPrice: p?.sellingPrice ?? next[i].unitPrice };
      return { ...f, partsUsed: next };
    });
  };

  const addService = () => setForm((f) => ({ ...f, servicesUsed: [...f.servicesUsed, { service: "", quantity: 1, unitPrice: 0 }] }));
  const removeService = (i: number) => setForm((f) => ({ ...f, servicesUsed: f.servicesUsed.filter((_, j) => j !== i) }));
  const onServiceSelect = (i: number, serviceId: string) => {
    const s = services.find((x) => x._id === serviceId);
    setForm((f) => {
      const next = [...f.servicesUsed];
      next[i] = { ...next[i], service: serviceId, unitPrice: s?.totalCost ?? next[i].unitPrice };
      return { ...f, servicesUsed: next };
    });
  };

  const addOtherWork = () => setForm((f) => ({ ...f, otherWork: [...f.otherWork, { description: "", quantity: 1, unitPrice: 0 }] }));
  const removeOtherWork = (i: number) => setForm((f) => ({ ...f, otherWork: f.otherWork.filter((_, j) => j !== i) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        vehicle: form.vehicle,
        workType: form.workType,
        description: form.description,
        status: form.status,
        workOrderDate: form.workOrderDate,
        mileageAtService: Number(form.mileageAtService) || 0,
        laborHours: Number(form.laborHours) || 0,
        laborRate: Number(form.laborRate) || 0,
        partsUsed: form.partsUsed.filter((p) => p.part),
        servicesUsed: form.servicesUsed.filter((s) => s.service),
        otherWork: form.otherWork.filter((o) => o.description.trim()),
        notes: form.notes || undefined,
      };
      if (isNew) {
        await post("/workorders", body);
      } else {
        await put(`/workorders/${id}`, body);
      }
      router.push("/workorders");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkOrder = async () => {
    if (!confirm("Delete this work order?")) return;
    setDeleting(true);
    try {
      await del(`/workorders/${id}`);
      router.push("/workorders");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-3xl">
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading work order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/workorders"
            className="rounded p-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            aria-label="Back to work orders"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isNew ? "New Work Order" : "Edit Work Order"}
          </h1>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={deleteWorkOrder}
            disabled={deleting}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-zinc-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-70"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      <form onSubmit={save} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        {!isNew && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800/50">
            <button
              type="button"
              role="switch"
              aria-checked={allowChangeCustomerVehicle}
              onClick={() => setAllowChangeCustomerVehicle((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 ${
                allowChangeCustomerVehicle ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  allowChangeCustomerVehicle ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Change customer / vehicle
            </span>
            {!allowChangeCustomerVehicle && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Customer and vehicle are locked
              </span>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer *</label>
          <select
            required
            value={form.customer}
            onChange={(e) => onCustomerChange(e.target.value)}
            disabled={!canChangeCustomerVehicle}
            className={`${selectClass} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.firstName} {c.lastName}
                {c.email ? ` (${c.email})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Vehicle *</label>
          <div className="mt-1 flex gap-2">
            <select
              required
              value={form.vehicle}
              onChange={(e) => onVehicleChange(e.target.value)}
              disabled={!form.customer || !canChangeCustomerVehicle}
              className={`min-w-0 flex-1 ${selectClass} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <option value="">
                {form.customer ? "Select vehicle" : "Select a customer first"}
              </option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {vehicleShortLabel(v)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddVehicleModalOpen(true)}
              disabled={!form.customer || !canChangeCustomerVehicle}
              className="shrink-0 rounded border border-dashed border-zinc-400 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-700"
              title={form.customer ? "Add new vehicle for this customer" : "Select a customer first"}
            >
              + New
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Work Type *</label>
            <select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })} className={selectClass}>
              {WORK_TYPES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status *</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description *</label>
          <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date *</label>
            <input required type="date" value={form.workOrderDate} onChange={(e) => setForm({ ...form, workOrderDate: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mileage *</label>
            <input required type="number" value={form.mileageAtService || ""} onChange={(e) => setForm({ ...form, mileageAtService: Number(e.target.value) || 0 })} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Services Used</label>
          <div className="mt-2 space-y-3">
            {form.servicesUsed.map((s, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-600 dark:bg-zinc-800/50">
                <div className="flex gap-2">
                  <select value={s.service} onChange={(e) => onServiceSelect(i, e.target.value)} className={`min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100`}>
                    <option value="">Select service</option>
                    {services.map((sv) => (
                      <option key={sv._id} value={sv._id}>{sv.name} - ${sv.totalCost}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setAddServiceModalForRow(i)} className="shrink-0 rounded border border-dashed border-zinc-400 px-2 py-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-700" title="Add new service">+ New</button>
                  <button type="button" onClick={() => removeService(i)} className="shrink-0 rounded bg-red-100 px-2 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" aria-label="Remove">✕</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Qty</label>
                    <input type="number" min={1} value={s.quantity} onChange={(e) => setForm((f) => { const next = [...f.servicesUsed]; next[i] = { ...next[i], quantity: Number(e.target.value) || 1 }; return { ...f, servicesUsed: next }; })} className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Unit price</label>
                    <input type="number" step="0.01" value={s.unitPrice} onChange={(e) => setForm((f) => { const next = [...f.servicesUsed]; next[i] = { ...next[i], unitPrice: Number(e.target.value) || 0 }; return { ...f, servicesUsed: next }; })} className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addService} className="mt-2 w-full rounded-lg border-2 border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50" style={{ minHeight: 44 }}>+ Add Service</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Parts Used</label>
          <div className="mt-2 space-y-3">
            {form.partsUsed.map((p, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-600 dark:bg-zinc-800/50">
                <div className="flex gap-2">
                  <select value={p.part} onChange={(e) => onPartSelect(i, e.target.value)} className={`min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100`}>
                    <option value="">Select part</option>
                    {parts.map((pt) => (
                      <option key={pt._id} value={pt._id}>{pt.name} - ${pt.sellingPrice}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setAddPartModalForRow(i)} className="shrink-0 rounded border border-dashed border-zinc-400 px-2 py-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-700" title="Add new part">+ New</button>
                  <button type="button" onClick={() => removePart(i)} className="shrink-0 rounded bg-red-100 px-2 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" aria-label="Remove">✕</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Qty</label>
                    <input type="number" min={1} value={p.quantity} onChange={(e) => setForm((f) => { const next = [...f.partsUsed]; next[i] = { ...next[i], quantity: Number(e.target.value) || 1 }; return { ...f, partsUsed: next }; })} className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Unit price</label>
                    <input type="number" step="0.01" value={p.unitPrice} onChange={(e) => setForm((f) => { const next = [...f.partsUsed]; next[i] = { ...next[i], unitPrice: Number(e.target.value) || 0 }; return { ...f, partsUsed: next }; })} className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addPart} className="mt-2 w-full rounded-lg border-2 border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50" style={{ minHeight: 44 }}>+ Add Part</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Other Work</label>
          <div className="mt-2 space-y-3">
            {form.otherWork.map((o, i) => (
              <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-600 dark:bg-zinc-800/50">
                <div className="flex gap-2">
                  <input type="text" placeholder="Description" value={o.description} onChange={(e) => setForm((f) => { const next = [...f.otherWork]; next[i] = { ...next[i], description: e.target.value }; return { ...f, otherWork: next }; })} className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400" />
                  <button type="button" onClick={() => removeOtherWork(i)} className="shrink-0 rounded bg-red-100 px-2 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300" aria-label="Remove">✕</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Qty</label>
                    <input type="number" min={1} value={o.quantity} onChange={(e) => setForm((f) => { const next = [...f.otherWork]; next[i] = { ...next[i], quantity: Number(e.target.value) || 1 }; return { ...f, otherWork: next }; })} className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Unit price</label>
                    <input type="number" step="0.01" value={o.unitPrice} onChange={(e) => setForm((f) => { const next = [...f.otherWork]; next[i] = { ...next[i], unitPrice: Number(e.target.value) || 0 }; return { ...f, otherWork: next }; })} className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addOtherWork} className="mt-2 w-full rounded-lg border-2 border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50" style={{ minHeight: 44 }}>+ Add Other Work</button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Labor Hours</label>
            <input type="number" step="0.5" value={form.laborHours || ""} onChange={(e) => setForm({ ...form, laborHours: Number(e.target.value) || 0 })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Labor Rate</label>
            <input type="number" step="0.01" value={form.laborRate || ""} onChange={(e) => setForm({ ...form, laborRate: Number(e.target.value) || 0 })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Total (calc)</label>
            <div className="mt-1 rounded border border-zinc-300 bg-zinc-50 px-3 py-2 text-center font-semibold text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100">${calcTotal(form).toFixed(2)}</div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <Link href="/workorders" className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-70">
            {saving ? "Saving..." : isNew ? "Create Work Order" : "Update"}
          </button>
        </div>
      </form>

      <VehicleModal
        open={addVehicleModalOpen}
        onClose={() => setAddVehicleModalOpen(false)}
        onSaved={async (vehicle) => {
          await refetchVehiclesForCustomer(form.customer);
          setForm((f) => ({
            ...f,
            vehicle: vehicle._id,
            mileageAtService: (vehicle as Vehicle & { mileage?: number }).mileage ?? f.mileageAtService,
          }));
          setAddVehicleModalOpen(false);
        }}
        initialCustomerId={form.customer || undefined}
      />
      <PartModal
        open={addPartModalForRow !== null}
        onClose={() => setAddPartModalForRow(null)}
        onSaved={async (part) => {
          await refetchOptions();
          if (addPartModalForRow !== null) {
            const i = addPartModalForRow;
            setForm((f) => {
              const next = [...f.partsUsed];
              if (!next[i]) return f;
              next[i] = { ...next[i], part: part._id, unitPrice: part.sellingPrice ?? next[i].unitPrice };
              return { ...f, partsUsed: next };
            });
          }
          setAddPartModalForRow(null);
        }}
      />
      <ServiceModal
        open={addServiceModalForRow !== null}
        onClose={() => setAddServiceModalForRow(null)}
        onSaved={async (service) => {
          await refetchOptions();
          if (addServiceModalForRow !== null) {
            const i = addServiceModalForRow;
            setForm((f) => {
              const next = [...f.servicesUsed];
              if (!next[i]) return f;
              next[i] = { ...next[i], service: service._id, unitPrice: service.totalCost ?? next[i].unitPrice };
              return { ...f, servicesUsed: next };
            });
          }
          setAddServiceModalForRow(null);
        }}
      />
    </div>
  );
}
