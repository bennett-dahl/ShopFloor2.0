import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requirePermissionForMethod } from "@/lib/api-auth";
import AlignmentTemplate from "@/models/AlignmentTemplate";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const authResult = await requirePermissionForMethod("alignmentTemplates", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const make = searchParams.get("make") ?? "";
    const model = searchParams.get("model") ?? "";
    const year = searchParams.get("year") ?? "";
    const alignmentType = searchParams.get("alignmentType") ?? "";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const query: Record<string, unknown> = {};
    if (make) query.make = new RegExp(make, "i");
    if (model) query.model = new RegExp(model, "i");
    if (year) query.year = year;
    if (alignmentType) query.alignmentType = alignmentType;

    const templates = await AlignmentTemplate.find(query)
      .sort({ make: 1, model: 1, year: 1 })
      .limit(limit)
      .lean();
    const total = await AlignmentTemplate.countDocuments(query);

    return NextResponse.json({
      templates,
      total,
    });
  } catch (err) {
    console.error("[GET /api/alignment-templates]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requirePermissionForMethod("alignmentTemplates", request.method);
  if (authResult instanceof NextResponse) return authResult;
  try {
    await connectDB();
    void User;
    const body = await request.json();
    const createdBy = authResult.session?.user?.id;
    const template = await AlignmentTemplate.create({
      ...body,
      ...(createdBy && { createdBy }),
    });
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("[POST /api/alignment-templates]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
