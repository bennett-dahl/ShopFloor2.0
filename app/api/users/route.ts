import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import User from "@/models/User";

export async function GET() {
  const authResult = await requirePermissionForMethod("users", "GET");
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const users = await User.find()
      .select("name email picture isActive role createdAt lastLogin")
      .populate("role", "name")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ users });
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
