import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import Setting from "@/models/Setting";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Setting not found" }, { status: 404 });
    }
    await connectDB();
    const setting = await Setting.findById(id).lean();
    if (!setting) {
      return NextResponse.json({ message: "Setting not found" }, { status: 404 });
    }
    return NextResponse.json(setting);
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Setting not found" }, { status: 404 });
    }
    await connectDB();
    const body = await request.json();
    const setting = await Setting.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!setting) {
      return NextResponse.json({ message: "Setting not found" }, { status: 404 });
    }
    return NextResponse.json(setting);
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Setting not found" }, { status: 404 });
    }
    await connectDB();
    const setting = await Setting.findByIdAndDelete(id);
    if (!setting) {
      return NextResponse.json({ message: "Setting not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Setting deleted" });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
