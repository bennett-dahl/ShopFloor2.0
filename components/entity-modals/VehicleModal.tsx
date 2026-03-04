"use client";

import { useState, useEffect } from "react";
import { get, post, put, del } from "@/lib/api";
import CustomerModal, { type Customer } from "./CustomerModal";

export type Vehicle = {
  _id: string;
  customer: Customer | string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
  isActive?: boolean;
};

const emptyForm = {
  customer: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  vin: "",
  licensePlate: "",
  color: "",
  mileage: 0,
  notes: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (vehicle: Vehicle) => void;
  editVehicle?: Vehicle | null;
  /** When adding a new vehicle, pre-fill the customer (e.g. from work order form). */
  initialCustomerId?: string;
  onDeactivated?: () => void;
};

export default function VehicleModal({ open, onClose, onSaved, editVehicle, initialCustomerId, onDeactivated }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    get<{ customers: Customer[] }>("/customers?limit=500")
      .then((r) => setCustomers(r.customers))
      .catch(() => setCustomers([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editVehicle) {
      const custId = typeof editVehicle.customer === "object" ? editVehicle.customer._id : editVehicle.customer;
      setForm({
        customer: custId,
        make: editVehicle.make,
        model: editVehicle.model,
        year: editVehicle.year,
        vin: editVehicle.vin ?? "",
        licensePlate: editVehicle.licensePlate ?? "",
        color: editVehicle.color ?? "",
        mileage: editVehicle.mileage ?? 0,
        notes: editVehicle.notes ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        customer: initialCustomerId ?? "",
      });
    }
  }, [open, editVehicle, initialCustomerId]);

  const handleDeactivate = async () => {
    if (!editVehicle || !onDeactivated) return;
    if (!confirm("Deactivate this vehicle? It will no longer appear in active lists.")) return;
    setDeactivating(true);
    try {
      await del(`/vehicles/${editVehicle._id}`);
      onDeactivated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async () => {
    if (!editVehicle || !onDeactivated) return;
    setActivating(true);
    try {
      const body = {
        ...form,
        year: Number(form.year),
        mileage: Number(form.mileage) || 0,
        vin: form.vin || undefined,
        licensePlate: form.licensePlate || undefined,
        color: form.color || undefined,
        notes: form.notes || undefined,
        isActive: true,
      };
      const updated = await put<Vehicle>(`/vehicles/${editVehicle._id}`, body);
      onSaved({ ...updated, _id: editVehicle._id });
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
        year: Number(form.year),
        mileage: Number(form.mileage) || 0,
        vin: form.vin || undefined,
        licensePlate: form.licensePlate || undefined,
        color: form.color || undefined,
        notes: form.notes || undefined,
      };
      if (editVehicle) {
        const updated = await put<Vehicle>(`/vehicles/${editVehicle._id}`, body);
        onSaved({ ...updated, _id: editVehicle._id });
      } else {
        const created = await post<Vehicle>("/vehicles", body);
        onSaved(created);
      }
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onCustomerSaved = (customer: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c._id === customer._id);
      if (exists) return prev.map((c) => (c._id === customer._id ? customer : c));
      return [...prev, customer];
    });
    setForm((f) => ({ ...f, customer: customer._id }));
    setCustomerModalOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white p-4 shadow-xl dark:bg-zinc-800 sm:max-h-[85vh] sm:max-w-lg sm:rounded-xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {editVehicle ? "Edit Vehicle" : "Add Vehicle"}
          </h2>
          <form onSubmit={save} className="mt-4 flex flex-1 flex-col space-y-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Customer *
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  required
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(true)}
                  className="shrink-0 rounded border border-dashed border-zinc-400 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  title="Add new customer"
                >
                  + New
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Year *
                </label>
                <input
                  required
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Make *
                </label>
                <input
                  required
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Model *
                </label>
                <input
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  VIN
                </label>
                <input
                  value={form.vin}
                  onChange={(e) => setForm({ ...form, vin: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  License Plate
                </label>
                <input
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Mileage
                </label>
                <input
                  type="number"
                  value={form.mileage || ""}
                  onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Color
                </label>
                <input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <div className="flex gap-2">
              {editVehicle && onDeactivated && (
                editVehicle.isActive === false ? (
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
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-70"
                >
                  {saving ? "Saving..." : editVehicle ? "Update" : "Add Vehicle"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <CustomerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSaved={onCustomerSaved}
      />
    </>
  );
}
