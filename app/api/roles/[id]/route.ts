import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Role from "@/models/Role";
import User from "@/models/User";
import { RESOURCES, type Resource } from "@/lib/permissions";
import mongoose from "mongoose";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("roles", "GET");
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    await connectDB();
    const role = await Role.findById(id).lean();
    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (err) {
    return errorResponse(err, "GET /api/roles/[id]");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("roles", "PUT");
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    await connectDB();
    const body = await request.json();
    const name = body.name != null ? String(body.name).trim() : undefined;
    const permissions = body.permissions != null ? normalizePermissions(body.permissions) : undefined;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (permissions !== undefined) update.permissions = permissions;
    const role = await Role.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(role);
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json({ message: "Role name already exists" }, { status: 400 });
    }
    return errorResponse(err, "PUT /api/roles/[id]");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("roles", "DELETE");
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    await connectDB();
    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    if (role.name === "Admin") {
      const adminCount = await User.countDocuments({ role: id });
      if (adminCount > 0) {
        return NextResponse.json(
          { message: "Cannot delete Admin role while users are assigned to it" },
          { status: 400 }
        );
      }
    }
    const usersWithRole = await User.countDocuments({ role: id });
    if (usersWithRole > 0) {
      return NextResponse.json(
        { message: "Cannot delete role that is assigned to users. Reassign users first." },
        { status: 400 }
      );
    }
    await Role.findByIdAndDelete(id);
    return NextResponse.json({ message: "Role deleted" });
  } catch (err) {
    return errorResponse(err, "DELETE /api/roles/[id]");
  }
}
