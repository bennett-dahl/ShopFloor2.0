"use client";

import { useEffect, useState, useCallback } from "react";
import { get } from "@/lib/api";
import CustomerModal, { type Customer } from "@/components/entity-modals/CustomerModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (showDeactivated) params.set("includeInactive", "true");
      params.set("limit", "100");
      const res = await get<{ customers: Customer[] }>(`/customers?${params}`);
      setCustomers(res.customers);
    } catch {
      setCustomers([]);
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

  const openEdit = (c: Customer) => {
    setEditing(c);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const formatDate = (s: string | undefined) =>
    s
      ? new Date(s).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Customers
        </h1>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          ➕ Add Customer
        </button>
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <input
          type="text"
          placeholder="Search customers..."
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
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Show deactivated customers</span>
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading customers...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-4xl">👥</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No customers found
          </h3>
          <p className="mt-1 text-zinc-700 dark:text-zinc-400">
            Get started by adding your first customer.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            ➕ Add Customer
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <button
              type="button"
              key={c._id}
              onClick={() => openEdit(c)}
              className={`rounded-xl border p-4 text-left transition-colors hover:shadow-sm dark:border-zinc-700 ${
                c.isActive === false
                  ? "border-zinc-200 bg-zinc-100/50 hover:border-zinc-300 dark:bg-zinc-800/50 dark:hover:border-zinc-600"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:bg-zinc-800 dark:hover:border-zinc-600"
              }`}
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="inline-flex items-center gap-1.5">
                  {c.firstName} {c.lastName}
                  {c.isActive === false && (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-400">Inactive</span>
                  )}
                </span>
              </h3>
              <div className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-400">
                <p>📧 {c.email}</p>
                <p>📞 {c.phone}</p>
                {c.address?.city && (
                  <p>📍 {[c.address.city, c.address.state].filter(Boolean).join(", ")}</p>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-500">
                Joined {formatDate(c.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      <CustomerModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={() => {
          load();
          closeModal();
        }}
        editCustomer={editing}
        onDeactivated={() => {
          load();
          closeModal();
        }}
      />
    </div>
  );
}
