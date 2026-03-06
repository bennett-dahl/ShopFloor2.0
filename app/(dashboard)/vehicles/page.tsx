"use client";

import { useEffect, useState, useCallback } from "react";
import { get } from "@/lib/api";
import VehicleModal, { type Vehicle } from "@/components/entity-modals/VehicleModal";
import { useCan } from "@/components/MeProvider";

export default function VehiclesPage() {
  const can = useCan("vehicles");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (showDeactivated) params.set("includeInactive", "true");
      params.set("limit", "100");
      const res = await get<{ vehicles: Vehicle[] }>(`/vehicles?${params}`);
      setVehicles(res.vehicles);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [search, showDeactivated]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const customerName = (v: Vehicle) => {
    const c = v.customer;
    if (typeof c === "object" && c) return `${c.firstName} ${c.lastName}`;
    return "";
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Vehicles
        </h1>
        {can.create && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            ➕ Add Vehicle
          </button>
        )}
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <input
          type="text"
          placeholder="Search by make, model, VIN, license, customer..."
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
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Show deactivated vehicles</span>
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-4xl">🚗</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No vehicles found
          </h3>
          {can.create && (
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              ➕ Add Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) =>
            can.update ? (
            <button
              type="button"
              key={v._id}
              onClick={() => openEdit(v)}
              className={`rounded-xl border p-4 text-left transition-colors hover:shadow-sm dark:border-zinc-700 ${
                v.isActive === false
                  ? "border-zinc-200 bg-zinc-100/50 hover:border-zinc-300 dark:bg-zinc-800/50 dark:hover:border-zinc-600"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:bg-zinc-800 dark:hover:border-zinc-600"
              }`}
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="inline-flex items-center gap-1.5">
                  {v.year} {v.make} {v.model}
                  {v.isActive === false && (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-400">Inactive</span>
                  )}
                </span>
              </h3>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-400">
                {customerName(v)}
              </p>
              {(v.licensePlate || v.vin) && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
                  {[v.licensePlate, v.vin].filter(Boolean).join(" · ")}
                </p>
              )}
              {v.mileage != null && v.mileage > 0 && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
                  {v.mileage.toLocaleString()} miles
                </p>
              )}
            </button>
            ) : (
            <div
              key={v._id}
              className={`rounded-xl border p-4 text-left dark:border-zinc-700 ${
                v.isActive === false
                  ? "border-zinc-200 bg-zinc-100/50 dark:bg-zinc-800/50"
                  : "border-zinc-200 bg-white dark:bg-zinc-800"
              }`}
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="inline-flex items-center gap-1.5">
                  {v.year} {v.make} {v.model}
                  {v.isActive === false && (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-400">Inactive</span>
                  )}
                </span>
              </h3>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-400">
                {customerName(v)}
              </p>
              {(v.licensePlate || v.vin) && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
                  {[v.licensePlate, v.vin].filter(Boolean).join(" · ")}
                </p>
              )}
              {v.mileage != null && v.mileage > 0 && (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
                  {v.mileage.toLocaleString()} miles
                </p>
              )}
            </div>
            )
          )}
        </div>
      )}

      <VehicleModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={() => {
          loadVehicles();
          closeModal();
        }}
        editVehicle={editing}
        onDeactivated={() => {
          loadVehicles();
          closeModal();
        }}
      />
    </div>
  );
}
