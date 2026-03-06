import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import type { Action, Resource } from "@/lib/permissions";
import { methodToAction } from "@/lib/permissions";

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "No token, authorization denied" },
      { status: 401 }
    );
  }
  return { session };
}

export async function requirePermission(
  resource: Resource,
  action: Action
): Promise<
  | { session: Awaited<ReturnType<typeof getAuthSession>> }
  | NextResponse
> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { session } = authResult;
  const roleId = (session.user as { roleId?: string }).roleId;
  if (!roleId) {
    return NextResponse.json(
      { message: "No role assigned" },
      { status: 403 }
    );
  }
  await connectDB();
  const role = await Role.findById(roleId).lean();
  if (!role) {
    return NextResponse.json(
      { message: "Role not found" },
      { status: 403 }
    );
  }
  if (role.name === "Admin") {
    return { session };
  }
  const entry = role.permissions?.find(
    (p) => (p as { resource: string }).resource === resource
  ) as { read: boolean; create: boolean; update: boolean; delete: boolean } | undefined;
  const allowed =
    entry &&
    (action === "read"
      ? entry.read
      : action === "create"
        ? entry.create
        : action === "update"
          ? entry.update
          : entry.delete);
  if (!allowed) {
    return NextResponse.json(
      { message: "Insufficient permission" },
      { status: 403 }
    );
  }
  return { session };
}

/** Convenience: require permission for the given HTTP method (GET→read, POST→create, etc.). */
export async function requirePermissionForMethod(
  resource: Resource,
  method: string
): Promise<
  | { session: Awaited<ReturnType<typeof getAuthSession>> }
  | NextResponse
> {
  const action = methodToAction(method);
  if (!action) {
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  }
  return requirePermission(resource, action);
}
