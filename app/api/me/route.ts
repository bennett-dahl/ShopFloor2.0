import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import { errorResponse } from "@/lib/api-error";
import User from "@/models/User";
import Role from "@/models/Role";
import type { PermissionsMap, Resource } from "@/lib/permissions";
import { RESOURCES } from "@/lib/permissions";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "No token, authorization denied" },
      { status: 401 }
    );
  }
  try {
    await connectDB();
    const user = await User.findById(session.user.id)
      .select("name email picture isActive role")
      .populate("role", "name permissions")
      .lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const role = user.role as unknown as { _id: string; name: string; permissions?: { resource: string; read: boolean; create: boolean; update: boolean; delete: boolean }[] } | null;
    let permissions: PermissionsMap = {};
    if (role?.name === "Admin") {
      RESOURCES.forEach((r) => {
        permissions[r] = { read: true, create: true, update: true, delete: true };
      });
    } else if (role?.permissions) {
      role.permissions.forEach((p) => {
        if (RESOURCES.includes(p.resource as Resource)) {
          permissions[p.resource as Resource] = {
            read: p.read,
            create: p.create,
            update: p.update,
            delete: p.delete,
          };
        }
      });
    }
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        isActive: user.isActive,
        roleId: role?._id ?? null,
        roleName: role?.name ?? null,
      },
      permissions,
    });
  } catch (err) {
    return errorResponse(err, "GET /api/me");
  }
}
