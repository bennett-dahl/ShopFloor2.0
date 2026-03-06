import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Invitation from "@/models/Invitation";
import User from "@/models/User";
import Role from "@/models/Role";

// Ensure populated model schema is registered (required for serverless cold starts)
void Role;

export async function GET() {
  const authResult = await requirePermissionForMethod("users", "GET");
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const invitations = await Invitation.find()
      .populate("role", "name")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ invitations });
  } catch (err) {
    return errorResponse(err, "GET /api/invitations");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissionForMethod("users", "POST");
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    const roleId = body.role;
    if (!roleId) {
      return NextResponse.json({ message: "Role is required" }, { status: 400 });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already has an account" },
        { status: 400 }
      );
    }
    const invitation = await Invitation.create({
      email,
      role: roleId,
    });
    await invitation.populate("role", "name");
    return NextResponse.json(invitation, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "This email has already been invited" },
        { status: 400 }
      );
    }
    return errorResponse(err, "POST /api/invitations");
  }
}
