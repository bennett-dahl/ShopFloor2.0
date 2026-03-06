import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import Role from "@/models/Role";
import { RESOURCES, type Resource } from "@/lib/permissions";

function normalizePermissions(
  body: { resource: string; read?: boolean; create?: boolean; update?: boolean; delete?: boolean }[]
): { resource: string; read: boolean; create: boolean; update: boolean; delete: boolean }[] {
  const byResource = new Map<string, { read: boolean; create: boolean; update: boolean; delete: boolean }>();
  RESOURCES.forEach((r) => {
    byResource.set(r, { read: false, create: false, update: false, delete: false });
  });
  body?.forEach((p) => {
    if (RESOURCES.includes(p.resource as Resource)) {
      byResource.set(p.resource, {
        read: Boolean(p.read),
        create: Boolean(p.create),
        update: Boolean(p.update),
        delete: Boolean(p.delete),
      });
    }
  });
  return Array.from(byResource.entries()).map(([resource, actions]) => ({
    resource,
    ...actions,
  }));
}

export async function GET() {
  const authResult = await requirePermissionForMethod("roles", "GET");
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const roles = await Role.find().sort({ name: 1 }).lean();
    return NextResponse.json({ roles });
  } catch (err) {
    console.error("[GET /api/roles]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissionForMethod("roles", "POST");
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }
    const permissions = normalizePermissions(body.permissions ?? []);
    const role = await Role.create({ name, permissions });
    return NextResponse.json(role, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json({ message: "Role name already exists" }, { status: 400 });
    }
    console.error("[POST /api/roles]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
