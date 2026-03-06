import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import Vehicle from "@/models/Vehicle";
import WorkOrder from "@/models/WorkOrder";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("vehicles", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const vehicle = await Vehicle.findById(id)
      .populate("customer", "firstName lastName email phone")
      .lean();
    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(vehicle);
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("vehicles", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const body = await request.json();
    const vehicle = await Vehicle.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("customer", "firstName lastName email phone")
      .lean();
    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }
    // If the vehicle's customer was updated, propagate to related work orders
    if (Object.prototype.hasOwnProperty.call(body, "customer") && vehicle.customer) {
      await WorkOrder.updateMany(
        { vehicle: id },
        { customer: vehicle.customer }
      );
    }
    return NextResponse.json(vehicle);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("vehicles", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Vehicle deactivated successfully" });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
