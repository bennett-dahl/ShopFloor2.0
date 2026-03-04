"use client";

import { useState, useEffect } from "react";
import { get, post, put, del } from "@/lib/api";

export type Customer = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  dateOfBirth?: string;
  notes?: string;
  createdAt?: string;
  isActive?: boolean;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: { street: "", city: "", state: "", zipCode: "" },
  dateOfBirth: "",
  notes: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
  editCustomer?: Customer | null;
  onDeactivated?: () => void;
};

export default function CustomerModal({ open, onClose, onSaved, editCustomer, onDeactivated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editCustomer) {
      setForm({
        firstName: editCustomer.firstName,
        lastName: editCustomer.lastName,
        email: editCustomer.email,
        phone: editCustomer.phone,
        address: {
          street: editCustomer.address?.street ?? "",
          city: editCustomer.address?.city ?? "",
          state: editCustomer.address?.state ?? "",
          zipCode: editCustomer.address?.zipCode ?? "",
        },
        dateOfBirth: editCustomer.dateOfBirth?.slice(0, 10) ?? "",
        notes: editCustomer.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editCustomer]);

  const handleDeactivate = async () => {
    if (!editCustomer || !onDeactivated) return;
    if (!confirm("Deactivate this customer? They will no longer appear in active lists.")) return;
    setDeactivating(true);
    try {
      await del(`/customers/${editCustomer._id}`);
      onDeactivated();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async () => {
    if (!editCustomer || !onDeactivated) return;
    setActivating(true);
    try {
      const body = {
        ...form,
        dateOfBirth: form.dateOfBirth || undefined,
        address:
          form.address.street || form.address.city || form.address.state || form.address.zipCode
            ? form.address
            : undefined,
        isActive: true,
      };
      const updated = await put<Customer>(`/customers/${editCustomer._id}`, body);
      onSaved({ ...updated, _id: editCustomer._id });
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
        dateOfBirth: form.dateOfBirth || undefined,
        address:
          form.address.street || form.address.city || form.address.state || form.address.zipCode
            ? form.address
            : undefined,
      };
      if (editCustomer) {
        const updated = await put<Customer>(`/customers/${editCustomer._id}`, body);
        onSaved({ ...updated, _id: editCustomer._id });
      } else {
        const created = await post<Customer>("/customers", body);
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl bg-white p-4 shadow-xl dark:bg-zinc-800 sm:max-h-[85vh] sm:max-w-lg sm:rounded-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {editCustomer ? "Edit Customer" : "Add New Customer"}
        </h2>
        <form onSubmit={save} className="mt-4 flex flex-1 flex-col space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                First Name *
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Last Name *
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Phone *
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Street
            </label>
            <input
              value={form.address.street}
              onChange={(e) =>
                setForm({ ...form, address: { ...form.address, street: e.target.value } })
              }
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                placeholder="City"
                value={form.address.city}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, city: e.target.value } })
                }
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
            <div>
              <input
                placeholder="State"
                value={form.address.state}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, state: e.target.value } })
                }
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
            <div>
              <input
                placeholder="ZIP"
                value={form.address.zipCode}
                onChange={(e) =>
                  setForm({ ...form, address: { ...form.address, zipCode: e.target.value } })
                }
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
              rows={3}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <div className="flex gap-2">
              {editCustomer && onDeactivated && (
                editCustomer.isActive === false ? (
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
                {saving ? "Saving..." : editCustomer ? "Update" : "Add Customer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
