/**
 * Single source of truth for RBAC resources and actions.
 * Add new resources here when adding new features; then use in API requirePermission and Roles UI matrix.
 */

export const RESOURCES = [
  "customers",
  "vehicles",
  "workorders",
  "parts",
  "services",
  "alignments",
  "alignmentTemplates",
  "settings",
  "users",
  "roles",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["read", "create", "update", "delete"] as const;

export type Action = (typeof ACTIONS)[number];

export interface IPermissionEntry {
  resource: Resource;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export type PermissionsMap = Partial<Record<Resource, { read: boolean; create: boolean; update: boolean; delete: boolean }>>;

/** Display labels for resources in the UI */
export const RESOURCE_LABELS: Record<Resource, string> = {
  customers: "Customers",
  vehicles: "Vehicles",
  workorders: "Work Orders",
  parts: "Parts",
  services: "Services",
  alignments: "Alignments",
  alignmentTemplates: "Alignment Templates",
  settings: "Settings",
  users: "Users",
  roles: "Roles",
};

/** HTTP method to action mapping */
export const METHOD_TO_ACTION: Record<string, Action> = {
  GET: "read",
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

export function methodToAction(method: string): Action | undefined {
  return METHOD_TO_ACTION[method];
}
