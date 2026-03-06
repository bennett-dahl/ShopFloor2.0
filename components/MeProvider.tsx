"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { get } from "@/lib/api";
import type { PermissionsMap, Resource } from "@/lib/permissions";

export type CanActions = { create: boolean; update: boolean; delete: boolean; read: boolean };

type MeUser = {
  id: string;
  name: string | null;
  email: string | null;
  picture: string | null;
  isActive: boolean;
  roleId: string | null;
  roleName: string | null;
};

type MeState = {
  user: MeUser | null;
  permissions: PermissionsMap | null;
  loading: boolean;
};

const MeContext = createContext<MeState>({
  user: null,
  permissions: null,
  loading: true,
});

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MeState>({
    user: null,
    permissions: null,
    loading: true,
  });

  useEffect(() => {
    get<{ user: MeUser; permissions: PermissionsMap }>("/me")
      .then((data) => {
        setState({
          user: data.user ?? null,
          permissions: data.permissions ?? null,
          loading: false,
        });
      })
      .catch(() => {
        setState({ user: null, permissions: null, loading: false });
      });
  }, []);

  return (
    <MeContext.Provider value={state}>
      {children}
    </MeContext.Provider>
  );
}

export function useMe() {
  return useContext(MeContext);
}

export function useCanRead(resource: Resource): boolean {
  const { permissions } = useMe();
  if (!permissions) return false;
  const p = permissions[resource];
  return Boolean(p?.read);
}

/** Returns { create, update, delete, read } for the given resource. Use to show/hide action buttons. */
export function useCan(resource: Resource): CanActions {
  const { permissions } = useMe();
  const p = permissions?.[resource];
  return {
    create: Boolean(p?.create),
    update: Boolean(p?.update),
    delete: Boolean(p?.delete),
    read: Boolean(p?.read),
  };
}

/** True if the user has read permission on at least one resource (e.g. to show dashboard content). */
export function useHasAnyRead(): boolean {
  const { permissions } = useMe();
  if (!permissions || typeof permissions !== "object") return false;
  return Object.values(permissions).some((p) => Boolean(p?.read));
}
