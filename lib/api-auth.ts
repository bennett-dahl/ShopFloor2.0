import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "No token, authorization denied" },
      { status: 401 }
    );
  }
  return { session };
}
