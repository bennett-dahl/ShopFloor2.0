"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { post } from "@/lib/api";
import { RESOURCES, RESOURCE_LABELS, type Resource } from "@/lib/permissions";
import { useCan } from "@/components/MeProvider";

type PermissionRow = { resource: string; read: boolean; create: boolean; update: boolean; delete: boolean };

const initialPermissions = (): PermissionRow[] =>
  RESOURCES.map((r) => ({
    resource: r,
    read: false,
    create: false,
    update: false,
    delete: false,
  }));

export default function NewRolePage() {
  const router = useRouter();
  const can = useCan("roles");
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<PermissionRow[]>(initialPermissions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setPerm = (resource: Resource, action: keyof Omit<PermissionRow, "resource">, value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => (p.resource === resource ? { ...p, [action]: value } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      await post("/roles", { name: trimmed, permissions });
      router.push("/settings/roles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/settings/roles"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Roles
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        New role
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="e.g. Manager"
          />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Permissions
          </h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Read
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Create
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Update
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {RESOURCES.map((resource) => {
                  const row = permissions.find((p) => p.resource === resource);
                  if (!row) return null;
                  return (
                    <tr key={resource}>
                      <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                        {RESOURCE_LABELS[resource]}
                      </td>
                      {(["read", "create", "update", "delete"] as const).map((action) => (
                        <td key={action} className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row[action]}
                            onChange={(e) => setPerm(resource, action, e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex gap-3">
          {can.create && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create role"}
          </button>
          )}
          <Link
            href="/settings/roles"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
