import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import Vehicle from "@/models/Vehicle";
import Customer from "@/models/Customer";

export async function GET(request: NextRequest) {
  const authResult = await requirePermissionForMethod("vehicles", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") ?? "";
    const customerId = searchParams.get("customerId") ?? "";
    const includeInactive = searchParams.get("includeInactive") === "true" || searchParams.get("includeInactive") === "1";
    const query: Record<string, unknown> = {};
    if (!includeInactive) query.isActive = true;
    if (customerId) query.customer = customerId;
    if (search) {
      const customerIds = await Customer.find({
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();
      const customerIdList = customerIds.map((c) => c._id);
      query.$or = [
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { licensePlate: { $regex: search, $options: "i" } },
        { vin: { $regex: search, $options: "i" } },
        ...(customerIdList.length > 0 ? [{ customer: { $in: customerIdList } }] : []),
      ];
    }

    const vehicles = await Vehicle.find(query)
      .populate("customer", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const total = await Vehicle.countDocuments(query);

    return NextResponse.json({
      vehicles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissionForMethod("vehicles", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const body = await request.json();
    const customer = await Customer.findById(body.customer);
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 400 }
      );
    }
    const vehicle = await Vehicle.create(body);
    await vehicle.populate("customer", "firstName lastName email phone");
    return NextResponse.json(vehicle, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "VIN already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
