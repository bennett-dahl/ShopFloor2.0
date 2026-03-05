import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import Alignment from "@/models/Alignment";
import Vehicle from "@/models/Vehicle";
import WorkOrder from "@/models/WorkOrder";
import AlignmentTemplate from "@/models/AlignmentTemplate";
import User from "@/models/User";
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
      return NextResponse.json({ message: "Alignment not found" }, { status: 404 });
    }
    await connectDB();
    void Vehicle;
    void WorkOrder;
    void AlignmentTemplate;
    void User;
    const alignment = await Alignment.findById(id)
      .populate("vehicle")
      .populate({
        path: "workOrder",
        select: "workOrderNumber description status workOrderDate",
        populate: [
          { path: "customer", select: "firstName lastName" },
          { path: "vehicle", select: "make model year" },
        ],
      })
      .populate("template")
      .populate("completedBy", "name")
      .lean();
    if (!alignment) {
      return NextResponse.json({ message: "Alignment not found" }, { status: 404 });
    }
    return NextResponse.json(alignment);
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
      return NextResponse.json({ message: "Alignment not found" }, { status: 404 });
    }
    await connectDB();
    void Vehicle;
    void WorkOrder;
    void AlignmentTemplate;
    void User;
    const body = await request.json();
    const alignment = await Alignment.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("vehicle", "make model year")
      .populate({
        path: "workOrder",
        select: "workOrderNumber description status workOrderDate",
        populate: [
          { path: "customer", select: "firstName lastName" },
          { path: "vehicle", select: "make model year" },
        ],
      })
      .populate("template", "make model year alignmentType")
      .populate("completedBy", "name")
      .lean();
    if (!alignment) {
      return NextResponse.json({ message: "Alignment not found" }, { status: 404 });
    }
    return NextResponse.json(alignment);
  } catch (err) {
    console.error("[PUT /api/alignments]", err);
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
      return NextResponse.json({ message: "Alignment not found" }, { status: 404 });
    }
    await connectDB();
    const alignment = await Alignment.findByIdAndDelete(id);
    if (!alignment) {
      return NextResponse.json({ message: "Alignment not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Alignment deleted" });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
