import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import WorkOrder, { getNextWorkOrderNumber } from "@/models/WorkOrder";
import Vehicle from "@/models/Vehicle";
import Customer from "@/models/Customer";
// Ensure refs used by populate are registered (required in serverless when this route runs in isolation)
import "@/models/Part";
import "@/models/Service";
import "@/models/User";

export async function GET(request: NextRequest) {
  const authResult = await requirePermissionForMethod("workorders", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = (searchParams.get("search") ?? "").trim();
    const status = searchParams.get("status") ?? "";
    const vehicleId = searchParams.get("vehicleId") ?? "";
    const query: Record<string, unknown> = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (status) query.status = status;
    if (search) {
      const regex = { $regex: search, $options: "i" };
      const searchConditions: Record<string, unknown>[] = [
        { description: regex },
        { workType: regex },
        { workOrderNumber: regex },
      ];
      const vehicleYear = Number(search);
      const vehicleOr: Record<string, unknown>[] = [
        { make: regex },
        { model: regex },
        { vin: regex },
        { licensePlate: regex },
      ];
      if (!Number.isNaN(vehicleYear)) vehicleOr.push({ year: vehicleYear });
      const [vehicleIds, customerIds] = await Promise.all([
        Vehicle.find({ $or: vehicleOr }).distinct("_id"),
        Customer.find({
          $or: [
            { firstName: regex },
            { lastName: regex },
          ],
        }).distinct("_id"),
      ]);
      if (vehicleIds.length) searchConditions.push({ vehicle: { $in: vehicleIds } });
      if (customerIds.length) searchConditions.push({ customer: { $in: customerIds } });
      query.$or = searchConditions;
    }

    const workOrders = await WorkOrder.find(query)
      .populate("vehicle", "make model year licensePlate")
      .populate("customer", "firstName lastName email")
      .populate("completedBy", "name")
      .populate("partsUsed.part", "name partNumber sellingPrice")
      .populate("servicesUsed.service", "name serviceCode totalCost")
      .sort({ workOrderDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const total = await WorkOrder.countDocuments(query);

    return NextResponse.json({
      workOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    return errorResponse(err, "GET /api/workorders");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissionForMethod("workorders", request.method);
  if (authResult instanceof NextResponse) return authResult;
  if (!authResult.session?.user?.id) {
    return NextResponse.json(
      { message: "No token, authorization denied" },
      { status: 401 }
    );
  }
  try {
    await connectDB();
    const body = await request.json();
    const vehicle = await Vehicle.findById(body.vehicle);
    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 400 }
      );
    }
    const workOrderNumber = await getNextWorkOrderNumber(WorkOrder);
    const workOrderData = {
      ...body,
      workOrderNumber,
      customer: vehicle.customer,
      completedBy: authResult.session.user.id,
    };
    const workOrder = await WorkOrder.create(workOrderData);
    await workOrder.populate([
      { path: "vehicle", select: "make model year licensePlate" },
      { path: "customer", select: "firstName lastName email" },
      { path: "completedBy", select: "name" },
    ]);
    return NextResponse.json(workOrder, { status: 201 });
  } catch (err) {
    return errorResponse(err, "POST /api/workorders");
  }
}
