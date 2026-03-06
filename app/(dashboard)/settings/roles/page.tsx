"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { get, patch } from "@/lib/api";
import { useCan } from "@/components/MeProvider";

type Role = { _id: string; name: string };

export default function SettingsRolesPage() {
  const can = useCan("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultRoleId, setDefaultRoleId] = useState<string | null>(null);
  const [defaultRoleLoading, setDefaultRoleLoading] = useState(true);
  const [defaultRoleSaving, setDefaultRoleSaving] = useState(false);

  const loadRoles = useCallback(() => {
    get<{ roles: Role[] }>("/roles")
      .then((res) => setRoles(res.roles ?? []))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, []);

  const loadDefaultRole = useCallback(() => {
    get<{ roleId: string | null }>("/settings/default-signup-role")
      .then((res) => setDefaultRoleId(res.roleId ?? null))
      .catch(() => setDefaultRoleId(null))
      .finally(() => setDefaultRoleLoading(false));
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadDefaultRole();
  }, [loadDefaultRole]);

  const handleDefaultRoleChange = async (roleId: string) => {
    const value = roleId === "" ? null : roleId;
    setDefaultRoleSaving(true);
    try {
      await patch("/settings/default-signup-role", { roleId: value ?? "" });
      setDefaultRoleId(value);
    } catch {
      // keep previous selection on error
    } finally {
      setDefaultRoleSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Roles
        </h1>
        {can.create && (
        <Link
          href="/settings/roles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Add role
        </Link>
        )}
      </div>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Configure access by resource and action (read, create, update, delete). Admin has full access.
      </p>

      {can.update && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Default role for new sign-ups
          </h2>
          <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
            When someone signs up with Google and has no invitation, they receive this role.
          </p>
          {defaultRoleLoading ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</span>
          ) : (
            <select
              value={defaultRoleId ?? ""}
              onChange={(e) => handleDefaultRoleChange(e.target.value)}
              disabled={defaultRoleSaving || roles.length === 0}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 disabled:opacity-60"
            >
              <option value="">— Use fallback (Basic, then Tech, then Admin) —</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          {defaultRoleSaving && (
            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">Saving…</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
          <p className="text-zinc-700 dark:text-zinc-400">Loading roles...</p>
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-4xl">🔐</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            No roles yet
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Run <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">npm run seed:roles</code> to create Admin, Tech, Basic, and Default.
          </p>
          {can.create && (
          <Link
            href="/settings/roles/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Add role
          </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {roles.map((role) => (
                <tr key={role._id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {role.name}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {can.update && (
                    <Link
                      href={`/settings/roles/${role._id}`}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                    >
                      Edit permissions
                    </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
