"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { get, post } from "@/lib/api";
import { useCan, useHasAnyRead, useMe } from "@/components/MeProvider";

type Stats = {
  customers: number;
  vehicles: number;
  workOrders: number;
  parts: number;
};

type WorkOrderItem = {
  _id: string;
  workOrderNumber?: string;
  description: string;
  workOrderDate: string;
  status: string;
  vehicle?: { make: string; model: string; year: number };
  customer?: { firstName: string; lastName: string };
};

type AlignmentItem = {
  _id: string;
  alignmentDate: string;
  alignmentType: string;
  vehicle?: { make: string; model: string; year: number };
  workOrder?: {
    workOrderNumber?: string;
    customer?: { firstName: string; lastName: string };
  };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { loading: meLoading } = useMe();
  const hasAnyRead = useHasAnyRead();
  const canCustomers = useCan("customers");
  const canVehicles = useCan("vehicles");
  const canWorkOrders = useCan("workorders");
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    vehicles: 0,
    workOrders: 0,
    parts: 0,
  });
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrderItem[]>([]);
  const [recentAlignments, setRecentAlignments] = useState<AlignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestAccessSending, setRequestAccessSending] = useState(false);
  const [requestAccessSent, setRequestAccessSent] = useState(false);
  const [requestAccessError, setRequestAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAnyRead) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [
          customersRes,
          vehiclesRes,
          workOrdersRes,
          partsRes,
          recentWORes,
          recentAlignRes,
        ] = await Promise.all([
          get<{ total: number }>("/customers?limit=1"),
          get<{ total: number }>("/vehicles?limit=1"),
          get<{ total: number }>("/workorders?limit=1"),
          get<{ total: number }>("/parts?limit=1"),
          get<{ workOrders: WorkOrderItem[] }>("/workorders?limit=5"),
          get<{ alignments: AlignmentItem[] }>("/alignments?limit=3"),
        ]);
        if (cancelled) return;
        setStats({
          customers: customersRes.total,
          vehicles: vehiclesRes.total,
          workOrders: workOrdersRes.total,
          parts: partsRes.total,
        });
        setRecentWorkOrders(recentWORes.workOrders);
        setRecentAlignments(recentAlignRes.alignments ?? []);
      } catch {
        if (!cancelled) {
          setRecentWorkOrders([]);
          setRecentAlignments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [hasAnyRead]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const userName = session?.user?.name ?? "User";

  const handleRequestAccess = async () => {
    setRequestAccessSending(true);
    setRequestAccessError(null);
    try {
      await post("/request-access", {});
      setRequestAccessSent(true);
    } catch (err) {
      setRequestAccessError(
        err instanceof Error ? err.message : "Failed to send request"
      );
    } finally {
      setRequestAccessSending(false);
    }
  };

  if (!meLoading && !hasAnyRead) {
    return (
      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-zinc-700 dark:text-zinc-400">
            Welcome, {userName}.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-8 text-center dark:border-amber-800/50 dark:bg-amber-950/20">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            You&apos;ve signed up, but you don&apos;t have access yet.
          </p>
          <p className="mt-2 text-zinc-700 dark:text-zinc-400">
            Contact an admin to request access. Click the button below to send
            them a notification email.
          </p>
          {requestAccessSent ? (
            <p className="mt-6 text-green-700 dark:text-green-300 font-medium">
              Request sent. An admin will be notified and can adjust your role
              in Settings → Users.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleRequestAccess}
              disabled={requestAccessSending}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-70"
            >
              {requestAccessSending ? "Sending…" : "Request access from admin"}
            </button>
          )}
          {requestAccessError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {requestAccessError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 sm:py-8 md:mx-auto md:max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-700 dark:text-zinc-400">
          Welcome back, {session?.user?.name ?? "User"}! Here&apos;s what&apos;s
          happening at Throttle Therapy Shop.
        </p>
      </div>

      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Work Orders
          </h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
              <p className="text-sm text-zinc-700 dark:text-zinc-400">
                Loading recent work orders...
              </p>
            </div>
          ) : recentWorkOrders.length === 0 ? (
            <p className="py-8 text-center text-zinc-700 dark:text-zinc-400">
              No recent work orders found.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentWorkOrders.map((wo) => (
                <li key={wo._id}>
                  <Link
                    href={`/workorders/${wo._id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 py-3 px-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700/50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {wo.workOrderNumber ?? wo._id}
                        {wo.customer
                          ? ` · ${wo.customer.firstName} ${wo.customer.lastName}`
                          : ""}
                        {wo.vehicle
                          ? ` · ${wo.vehicle.year} ${wo.vehicle.make} ${wo.vehicle.model}`
                          : ""}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {wo.description}
                      </p>
                      <span className="text-xs text-zinc-600 dark:text-zinc-500">
                        {formatDate(wo.workOrderDate)}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        wo.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : wo.status === "in_progress"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {wo.status.replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            <Link
              href="/workorders"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all work orders →
            </Link>
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Alignments
          </h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
              <p className="text-sm text-zinc-700 dark:text-zinc-400">
                Loading recent alignments...
              </p>
            </div>
          ) : recentAlignments.length === 0 ? (
            <p className="py-8 text-center text-zinc-700 dark:text-zinc-400">
              No recent alignments found.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentAlignments.map((a) => (
                <li key={a._id}>
                  <Link
                    href={`/alignments/${a._id}`}
                    className="block rounded-lg border border-zinc-200 py-3 px-4 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700/50"
                  >
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {a.vehicle
                        ? `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}`
                        : "—"}
                      {a.workOrder?.customer
                        ? ` · ${a.workOrder.customer.firstName} ${a.workOrder.customer.lastName}`
                        : ""}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {a.alignmentType}
                      {a.workOrder?.workOrderNumber
                        ? ` · ${a.workOrder.workOrderNumber}`
                        : ""}
                    </p>
                    <span className="text-xs text-zinc-600 dark:text-zinc-500">
                      {formatDate(a.alignmentDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            <Link
              href="/alignments"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View all alignments →
            </Link>
          </p>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl dark:bg-indigo-900/50">
              👥
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.customers}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-400">
                Total Customers
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl dark:bg-indigo-900/50">
              🚗
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.vehicles}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-400">
                Vehicles in System
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl dark:bg-indigo-900/50">
              🔧
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.workOrders}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-400">
                Work Orders This Month
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl dark:bg-indigo-900/50">
              ⚙️
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {stats.parts}
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-400">
                Parts in Inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {canCustomers.create && (
          <Link
            href="/customers"
            className="flex items-center gap-3 rounded-lg border-2 border-zinc-200 bg-zinc-50 py-4 px-4 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <span className="text-2xl">👥</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              New Customer
            </span>
          </Link>
          )}
          {canVehicles.create && (
          <Link
            href="/vehicles"
            className="flex items-center gap-3 rounded-lg border-2 border-zinc-200 bg-zinc-50 py-4 px-4 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <span className="text-2xl">🚗</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Add Vehicle
            </span>
          </Link>
          )}
          {canWorkOrders.create && (
          <Link
            href="/workorders"
            className="flex items-center gap-3 rounded-lg border-2 border-zinc-200 bg-zinc-50 py-4 px-4 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <span className="text-2xl">🔧</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              New Work Order
            </span>
          </Link>
          )}
        </div>
      </div>
    </div>
  );
}
