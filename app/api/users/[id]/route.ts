import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import User from "@/models/User";
import Role from "@/models/Role";
import mongoose from "mongoose";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("users", "PATCH");
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    await connectDB();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.role !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(body.role)) {
        return NextResponse.json({ message: "Invalid role id" }, { status: 400 });
      }
      const roleExists = await Role.findById(body.role);
      if (!roleExists) {
        return NextResponse.json({ message: "Role not found" }, { status: 400 });
      }
      update.role = body.role;
    }
    if (body.isActive !== undefined) {
      update.isActive = Boolean(body.isActive);
    }
    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .select("name email picture isActive role createdAt lastLogin")
      .populate("role", "name")
      .lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err) {
    return errorResponse(err, "PATCH /api/users/[id]");
  }
}
