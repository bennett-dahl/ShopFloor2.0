import { describe, it, expect, beforeAll, vi } from "vitest";
import "../helpers/auth";
import { POST } from "@/app/api/request-access/route";
import { post } from "../helpers/request";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import User from "@/models/User";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(() => Promise.resolve({ ok: true })),
}));

describe("Request access API", () => {
  beforeAll(async () => {
    await connectDB();
    let adminRole = await Role.findOne({ name: "Admin" });
    if (!adminRole) {
      adminRole = await Role.create({
        name: "Admin",
        permissions: [{ resource: "users", read: true, create: true, update: true, delete: true }],
      });
    }
    const existing = await User.findOne({ email: "admin-request-access@example.com" });
    if (!existing) {
      await User.create({
        googleId: "request-access-admin-google-id",
        email: "admin-request-access@example.com",
        name: "Admin User",
        role: adminRole._id,
      });
    }
  });

  it("sends request and returns 200", async () => {
    const { status, data } = await post(POST, "/api/request-access", {});
    expect(status).toBe(200);
    expect(data).toMatchObject({ success: true });
  });
});
