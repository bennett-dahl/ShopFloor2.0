import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Customer from "@/models/Customer";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("customers", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(customer);
  } catch (err) {
    return errorResponse(err, "GET /api/customers/[id]");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("customers", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const body = await request.json();
    const customer = await Customer.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(customer);
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }
    return errorResponse(err, "PUT /api/customers/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionForMethod("customers", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    await connectDB();
    const customer = await Customer.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!customer) {
      return NextResponse.json(
        { message: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Customer deactivated successfully" });
  } catch (err) {
    return errorResponse(err, "DELETE /api/customers/[id]");
  }
}
