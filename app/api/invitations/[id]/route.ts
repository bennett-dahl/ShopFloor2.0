import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Invitation from "@/models/Invitation";
import mongoose from "mongoose";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("users", "DELETE");
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }
    await connectDB();
    const invitation = await Invitation.findByIdAndDelete(id);
    if (!invitation) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Invitation cancelled" });
  } catch (err) {
    return errorResponse(err, "DELETE /api/invitations/[id]");
  }
}
