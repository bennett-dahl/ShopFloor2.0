import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import WorkOrder from "@/models/WorkOrder";
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
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const workOrder = await WorkOrder.findById(id)
      .populate("vehicle", "make model year licensePlate vin")
      .populate("customer", "firstName lastName email phone")
      .populate("completedBy", "name")
      .populate("partsUsed.part", "name partNumber sellingPrice")
      .populate("servicesUsed.service", "name serviceCode totalCost")
      .lean();
    if (!workOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(workOrder);
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
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const body = await request.json();
    const doc = await WorkOrder.findById(id);
    if (!doc) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }
    doc.set(body);
    await doc.save();
    await doc.populate([
      { path: "vehicle", select: "make model year licensePlate" },
      { path: "customer", select: "firstName lastName email" },
      { path: "completedBy", select: "name" },
      { path: "partsUsed.part", select: "name partNumber sellingPrice" },
      { path: "servicesUsed.service", select: "name serviceCode totalCost" },
    ]);
    return NextResponse.json(doc);
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
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const workOrder = await WorkOrder.findByIdAndDelete(id);
    if (!workOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Work order deleted successfully" });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
