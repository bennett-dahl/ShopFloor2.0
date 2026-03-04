import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import WorkOrder from "@/models/WorkOrder";
import mongoose from "mongoose";

export async function PATCH(
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
    const body = await request.json();
    const { status } = body;
    await connectDB();
    const workOrder = await WorkOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("vehicle", "make model year licensePlate")
      .populate("customer", "firstName lastName email")
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
