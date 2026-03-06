import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import AlignmentTemplate from "@/models/AlignmentTemplate";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("alignmentTemplates", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }
    await connectDB();
    const template = await AlignmentTemplate.findById(id).lean();
    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (err) {
    return errorResponse(err, "GET /api/alignment-templates/[id]");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("alignmentTemplates", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }
    await connectDB();
    const body = await request.json();
    const template = await AlignmentTemplate.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (err) {
    return errorResponse(err, "PUT /api/alignment-templates/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("alignmentTemplates", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }
    await connectDB();
    const template = await AlignmentTemplate.findByIdAndDelete(id);
    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Template deleted" });
  } catch (err) {
    return errorResponse(err, "DELETE /api/alignment-templates/[id]");
  }
}
