import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Alignment from "@/models/Alignment";
import Vehicle from "@/models/Vehicle";
import WorkOrder from "@/models/WorkOrder";
import AlignmentTemplate from "@/models/AlignmentTemplate";
import User from "@/models/User";
import Customer from "@/models/Customer";

export async function GET(request: NextRequest) {
  const authResult = await requirePermissionForMethod("alignments", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    void Vehicle;
    void WorkOrder;
    void AlignmentTemplate;
    void User;
    void Customer;
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId") ?? "";
    const workOrderId = searchParams.get("workOrderId") ?? "";
    const alignmentType = searchParams.get("alignmentType") ?? "";
    const templateId = searchParams.get("templateId") ?? "";
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const query: Record<string, unknown> = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (workOrderId) query.workOrder = workOrderId;
    if (alignmentType) query.alignmentType = alignmentType;
    if (templateId) query.template = templateId;

    const alignments = await Alignment.find(query)
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
      .sort({ alignmentDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const total = await Alignment.countDocuments(query);

    return NextResponse.json({
      alignments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    return errorResponse(err, "GET /api/alignments");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissionForMethod("alignments", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    void Vehicle;
    void WorkOrder;
    void AlignmentTemplate;
    void User;
    void Customer;
    const body = await request.json();
    const completedBy = authResult.session?.user?.id;
    const alignment = await Alignment.create({
      ...body,
      ...(completedBy && { completedBy }),
    });
    await alignment.populate([
      { path: "vehicle", select: "make model year" },
      {
        path: "workOrder",
        select: "workOrderNumber description status workOrderDate",
        populate: [
          { path: "customer", select: "firstName lastName" },
          { path: "vehicle", select: "make model year" },
        ],
      },
      { path: "template", select: "make model year alignmentType" },
      { path: "completedBy", select: "name" },
    ]);
    return NextResponse.json(alignment, { status: 201 });
  } catch (err) {
    return errorResponse(err, "POST /api/alignments");
  }
}
