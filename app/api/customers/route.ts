import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import { errorResponse } from "@/lib/api-error";
import Customer from "@/models/Customer";

export async function GET(request: NextRequest) {
  const authResult = await requirePermissionForMethod("customers", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") ?? "";
    const includeInactive = searchParams.get("includeInactive") === "true" || searchParams.get("includeInactive") === "1";
    const query: Record<string, unknown> = {};
    if (!includeInactive) query.isActive = true;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const total = await Customer.countDocuments(query);

    return NextResponse.json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    return errorResponse(err, "GET /api/customers");
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissionForMethod("customers", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const body = await request.json();
    const customer = await Customer.create(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }
    return errorResponse(err, "POST /api/customers");
  }
}
