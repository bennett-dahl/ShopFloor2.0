import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Alignment from "@/models/Alignment";
import Vehicle from "@/models/Vehicle";
import WorkOrder from "@/models/WorkOrder";
import AlignmentTemplate from "@/models/AlignmentTemplate";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("alignments", request.method);
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
  } catch (err) {
    return errorResponse(err, "GET /api/alignments/[id]");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("alignments", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Alignment not found" }, { status: 404 });
    }
    await connectDB();
    void AlignmentTemplate;
    void User;
    const body = await request.json();
    if (body.vehicle != null) {
      const vehicle = await Vehicle.findById(body.vehicle).lean();
      if (!vehicle) {
        return NextResponse.json(
          { message: "Vehicle not found" },
          { status: 400 }
        );
      }
    }
    if (body.workOrder != null && body.workOrder !== "") {
      const workOrder = await WorkOrder.findById(body.workOrder).lean();
      if (!workOrder) {
        return NextResponse.json(
          { message: "Work order not found" },
          { status: 400 }
        );
      }
    }
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
    return errorResponse(err, "PUT /api/alignments/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("alignments", request.method);
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
  } catch (err) {
    return errorResponse(err, "DELETE /api/alignments/[id]");
  }
}
