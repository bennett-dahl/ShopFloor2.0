import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import Part from "@/models/Part";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("parts", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Part not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const part = await Part.findById(id).lean();
    if (!part) {
      return NextResponse.json(
        { message: "Part not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(part);
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("parts", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Part not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const body = await request.json();
    const part = await Part.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!part) {
      return NextResponse.json(
        { message: "Part not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(part);
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "Part number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("parts", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Part not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const part = await Part.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!part) {
      return NextResponse.json(
        { message: "Part not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Part deactivated successfully" });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
