import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import User from "@/models/User";
import Role from "@/models/Role";
import { sendEmail } from "@/lib/email";

export async function POST() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "No token, authorization denied" },
      { status: 401 }
    );
  }
  const userName = session.user.name ?? "User";
  const userEmail = session.user.email ?? "";

  try {
    await connectDB();
    const adminRole = await Role.findOne({ name: "Admin" }).lean();
    if (!adminRole) {
      return NextResponse.json(
        { message: "No admin role found" },
        { status: 500 }
      );
    }
    const admins = await User.find({ role: adminRole._id, isActive: true })
      .select("email")
      .lean();
    const adminEmails = admins
      .map((u) => u.email?.trim())
      .filter((e): e is string => Boolean(e));
    if (adminEmails.length === 0) {
      return NextResponse.json(
        { message: "No admin emails found to notify" },
        { status: 500 }
      );
    }

    const subject = `Access request – ${userName}`;
    const text = `A user has requested access to Throttle Therapy Shop.

Please adjust their role in Settings → Users.

Requesting user: ${userName} (${userEmail})

This is an automated message from Throttle Therapy Shop.`;

    const result = await sendEmail(adminEmails, subject, text);
    if (!result.ok) {
      console.error("[POST /api/request-access] sendEmail:", result.error);
      const message =
        result.error === "Email not configured or no recipients"
          ? "Email is not configured. An administrator needs to set RESEND_API_KEY."
          : result.error;
      return NextResponse.json({ message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/request-access]", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
