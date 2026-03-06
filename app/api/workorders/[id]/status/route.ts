import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import WorkOrder from "@/models/WorkOrder";
import mongoose from "mongoose";

// Ensure populated model schemas are registered (required for serverless cold starts)
import "@/models/Vehicle";
import "@/models/Customer";
import "@/models/User";
import "@/models/Part";
import "@/models/Service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("workorders", request.method);
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
  } catch (err) {
    return errorResponse(err, "PATCH /api/workorders/[id]/status");
  }
}
