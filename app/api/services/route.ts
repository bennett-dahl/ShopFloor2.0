import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import Service from "@/models/Service";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { serviceCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const services = await Service.find(query)
      .sort({ name: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const total = await Service.countDocuments(query);

    return NextResponse.json({
      services,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const body = await request.json();
    const service = await Service.create(body);
    return NextResponse.json(service, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: number; name?: string; message?: string };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "Service code already exists" },
        { status: 400 }
      );
    }
    if (e.name === "ValidationError") {
      const message =
        typeof e.message === "string"
          ? e.message
          : "Validation failed";
      return NextResponse.json({ message }, { status: 400 });
    }
    console.error("POST /api/services error:", e);
    return NextResponse.json(
      { message: e.message ?? "Server error" },
      { status: 500 }
    );
  }
}
