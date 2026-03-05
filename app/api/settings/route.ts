import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import Setting from "@/models/Setting";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "";
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 500);
    const query: Record<string, unknown> = {};
    if (category) query.category = category;

    const settings = await Setting.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .limit(limit)
      .lean();
    const total = await Setting.countDocuments(query);

    return NextResponse.json({
      settings,
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
    const setting = await Setting.create(body);
    return NextResponse.json(setting, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
