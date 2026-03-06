import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Service from "@/models/Service";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("services", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const service = await Service.findById(id).lean();
    if (!service) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(service);
  } catch (err) {
    return errorResponse(err, "GET /api/services/[id]");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("services", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const body = await request.json();
    const service = await Service.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!service) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(service);
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "Service code already exists" },
        { status: 400 }
      );
    }
    return errorResponse(err, "PUT /api/services/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("services", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (err) {
    return errorResponse(err, "DELETE /api/services/[id]");
  }
}
