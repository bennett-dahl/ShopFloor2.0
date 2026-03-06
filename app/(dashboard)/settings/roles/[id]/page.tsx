"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { get, put } from "@/lib/api";
import { RESOURCES, RESOURCE_LABELS, type Resource } from "@/lib/permissions";
import { useCan } from "@/components/MeProvider";

type PermissionRow = { resource: string; read: boolean; create: boolean; update: boolean; delete: boolean };
type Role = { _id: string; name: string; permissions?: PermissionRow[] };

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const can = useCan("roles");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    get<Role>(`/roles/${id}`)
      .then((r) => {
        setRole(r);
        setName(r.name ?? "");
        if (r.permissions && r.permissions.length > 0) {
          const sorted = RESOURCES.map((res) => {
            const p = r.permissions!.find((x) => x.resource === res);
            return p
              ? { resource: res, read: p.read, create: p.create, update: p.update, delete: p.delete }
              : { resource: res, read: false, create: false, update: false, delete: false };
          });
          setPermissions(sorted);
        } else {
          setPermissions(
            RESOURCES.map((r) => ({ resource: r, read: false, create: false, update: false, delete: false }))
          );
        }
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, [id]);

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
      await put(`/roles/${id}`, { name: trimmed, permissions });
      router.push("/settings/roles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
        <p className="text-zinc-700 dark:text-zinc-400">Loading role...</p>
      </div>
    );
  }
  if (!role) {
    return (
      <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">Role not found</p>
        <Link href="/settings/roles" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400">
          ← Back to Roles
        </Link>
      </div>
    );
  }

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
        Edit role: {role.name}
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
          {can.update && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
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
