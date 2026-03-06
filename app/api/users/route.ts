import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import User from "@/models/User";
import Role from "@/models/Role";

// Ensure populated model schema is registered (required for serverless cold starts)
void Role;

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
    return errorResponse(err, "GET /api/users");
  }
}
