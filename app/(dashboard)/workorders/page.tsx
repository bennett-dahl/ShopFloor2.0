"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { get } from "@/lib/api";
import { useCan } from "@/components/MeProvider";

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
  workOrderNumber?: string;
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

function workOrderTotal(wo: WorkOrder): number {
  let t = (wo.laborHours ?? 0) * (wo.laborRate ?? 0);
  wo.partsUsed?.forEach((p: { quantity?: number; unitPrice?: number }) => {
    t += (p.quantity ?? 0) * (p.unitPrice ?? 0);
  });
  wo.servicesUsed?.forEach((s: { quantity?: number; unitPrice?: number }) => {
    t += (s.quantity ?? 0) * (s.unitPrice ?? 0);
  });
  wo.otherWork?.forEach((w: { quantity?: number; unitPrice?: number }) => {
    t += (w.quantity ?? 0) * (w.unitPrice ?? 0);
  });
  return t > 0 ? t : (wo.totalCost ?? 0);
}

export default function WorkOrdersPage() {
  const can = useCan("workorders");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");
      const res = await get<{ workOrders: WorkOrder[] }>(`/workorders?${params}`);
      setWorkOrders(res.workOrders);
    } catch {
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Work Orders
        </h1>
        {can.create && (
          <Link
            href="/workorders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            ➕ New Work Order
          </Link>
        )}
      </div>
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by description, customer name, or vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder:text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading work orders...</p>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-4xl">🔧</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No work orders found
          </h3>
          {can.create && (
            <Link
              href="/workorders/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
            >
              ➕ New Work Order
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {workOrders.map((wo) => {
            const v = wo.vehicle as Vehicle;
            const c = wo.customer as Customer;
            return (
              <Link
                key={wo._id}
                href={`/workorders/${wo._id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {wo.workOrderNumber ?? wo._id} · {c?.firstName} {c?.lastName}
                    </h3>
                    <p className="text-zinc-700 dark:text-zinc-400">
                      {v?.year} {v?.make} {v?.model}
                    </p>
                    <p className="text-sm italic text-zinc-600 dark:text-zinc-500">{wo.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      wo.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : wo.status === "in_progress"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : wo.status === "cancelled"
                            ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    }`}
                  >
                    {wo.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-700 dark:text-zinc-400">
                  <span>📅 {formatDate(wo.workOrderDate)}</span>
                  <span>📊 {wo.mileageAtService?.toLocaleString()} miles</span>
                  <span>💰 ${workOrderTotal(wo).toFixed(2)}</span>
                  {wo.completedBy && <span>👤 {wo.completedBy.name}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
