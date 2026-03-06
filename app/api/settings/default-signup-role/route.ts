import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import Setting from "@/models/Setting";
import Role from "@/models/Role";
import mongoose from "mongoose";

const CATEGORY = "app";
const NAME = "defaultSignupRoleId";

export async function GET() {
  const authResult = await requirePermissionForMethod("roles", "GET");
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const doc = await Setting.findOne({ category: CATEGORY, name: NAME })
      .lean();
    const roleId = doc?.value?.trim() || null;
    if (roleId && !mongoose.Types.ObjectId.isValid(roleId)) {
      return NextResponse.json({ roleId: null });
    }
    if (roleId) {
      const role = await Role.findById(roleId).lean();
      if (!role) return NextResponse.json({ roleId: null });
    }
    return NextResponse.json({ roleId });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requirePermissionForMethod("roles", "PUT");
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const body = await request.json();
    const roleId = typeof body.roleId === "string" ? body.roleId.trim() : "";
    if (!roleId) {
      await Setting.findOneAndDelete({ category: CATEGORY, name: NAME });
      return NextResponse.json({ roleId: null });
    }
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return NextResponse.json(
        { message: "Invalid role ID" },
        { status: 400 }
      );
    }
    const role = await Role.findById(roleId).lean();
    if (!role) {
      return NextResponse.json(
        { message: "Role not found" },
        { status: 400 }
      );
    }
    await Setting.findOneAndUpdate(
      { category: CATEGORY, name: NAME },
      { $set: { category: CATEGORY, name: NAME, value: roleId } },
      { new: true, upsert: true }
    );
    return NextResponse.json({ roleId });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
