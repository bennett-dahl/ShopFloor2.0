"use client";

import { useEffect, useState } from "react";
import { get, patch, post, del } from "@/lib/api";
import { useCan } from "@/components/MeProvider";

type Role = { _id: string; name: string };
type User = {
  _id: string;
  name: string;
  email: string;
  picture?: string;
  isActive: boolean;
  role: Role | { _id: string; name: string };
  lastLogin?: string;
};
type Invitation = {
  _id: string;
  email: string;
  role: Role | { _id: string; name: string };
  createdAt: string;
};

export default function SettingsUsersPage() {
  const can = useCan("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      get<{ users: User[] }>("/users"),
      get<{ roles: Role[] }>("/roles"),
      get<{ invitations: Invitation[] }>("/invitations").catch(() => ({ invitations: [] })),
    ])
      .then(([uRes, rRes, iRes]) => {
        setUsers(uRes.users ?? []);
        setRoles(rRes.roles ?? []);
        setInvitations(iRes.invitations ?? []);
      })
      .catch(() => {
        setUsers([]);
        setRoles([]);
        setInvitations([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (userId: string, roleId: string) => {
    setUpdatingId(userId);
    try {
      await patch(`/users/${userId}`, { role: roleId });
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id !== userId) return u;
          const role = roles.find((r) => r._id === roleId);
          return { ...u, role: role ?? u.role };
        })
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const changeActive = async (userId: string, isActive: boolean) => {
    setUpdatingId(userId);
    try {
      await patch(`/users/${userId}`, { isActive });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isActive } : u))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    const email = inviteEmail.trim();
    if (!email) {
      setInviteError("Email is required");
      return;
    }
    if (!inviteRoleId) {
      setInviteError("Please select a role");
      return;
    }
    setInviting(true);
    try {
      await post("/invitations", { email, role: inviteRoleId });
      setInviteEmail("");
      setInviteRoleId("");
      load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  const cancelInvitation = async (id: string) => {
    setCancellingId(id);
    try {
      await del(`/invitations/${id}`);
      setInvitations((prev) => prev.filter((i) => i._id !== id));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
        <p className="text-zinc-700 dark:text-zinc-400">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Users
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Users sign in with Google. Assign a role to control access. Invite by email to pre-assign a role—when they sign in with that email, they get the chosen role.
      </p>

      {can.create && (
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Invite by email
        </h2>
        <form onSubmit={submitInvite} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Role
            </label>
            <select
              value={inviteRoleId}
              onChange={(e) => setInviteRoleId(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {inviting ? "Inviting…" : "Invite"}
          </button>
          {inviteError && (
            <p className="text-sm text-red-600 dark:text-red-400">{inviteError}</p>
          )}
        </form>
        {invitations.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Pending invitations
            </h3>
            <ul className="space-y-2">
              {invitations.map((inv) => (
                <li
                  key={inv._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800/50"
                >
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {inv.email}
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                      → {(inv.role as { name?: string }).name ?? "—"}
                    </span>
                  </span>
                  {can.delete && (
                  <button
                    type="button"
                    onClick={() => cancelInvitation(inv._id)}
                    disabled={cancellingId === inv._id}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                  >
                    {cancellingId === inv._id ? "Cancelling…" : "Cancel invitation"}
                  </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}

      {users.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center dark:bg-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-400">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {users.map((user) => {
                const role = user.role as { _id: string; name: string } | undefined;
                const isUpdating = updatingId === user._id;
                return (
                  <tr key={user._id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={role?._id ?? ""}
                        onChange={(e) => changeRole(user._id, e.target.value)}
                        disabled={isUpdating || !can.update}
                        className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-50"
                      >
                        {roles.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={user.isActive}
                          onChange={(e) => changeActive(user._id, e.target.checked)}
                          disabled={isUpdating || !can.update}
                          className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 disabled:opacity-50"
                        />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
