import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import Part from "@/models/Part";

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
    const includeInactive = searchParams.get("includeInactive") === "true" || searchParams.get("includeInactive") === "1";
    const query: Record<string, unknown> = {};
    if (!includeInactive) query.isActive = true;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { partNumber: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const parts = await Part.find(query)
      .sort({ name: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    const total = await Part.countDocuments(query);

    return NextResponse.json({
      parts,
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
    const part = await Part.create(body);
    return NextResponse.json(part, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) {
      return NextResponse.json(
        { message: "Part number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
