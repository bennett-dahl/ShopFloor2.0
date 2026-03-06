import { describe, it, expect, beforeAll } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/invitations/route";
import { get, post } from "../helpers/request";
import { del } from "../helpers/request";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import Invitation from "@/models/Invitation";
import User from "@/models/User";

async function createRole() {
  await connectDB();
  let role = await Role.findOne({ name: "Admin" });
  if (!role) {
    role = await Role.create({
      name: "Admin",
      permissions: [{ resource: "users", read: true, create: true, update: true, delete: true }],
    });
  }
  return role._id.toString();
}

describe("Invitations API", () => {
  let roleId: string;

  beforeAll(async () => {
    roleId = await createRole();
  });

  describe("GET /api/invitations", () => {
    it("returns list of invitations", async () => {
      const { status, data } = await get(GET, "/api/invitations");
      expect(status).toBe(200);
      expect(data).toHaveProperty("invitations");
      expect(Array.isArray((data as { invitations: unknown[] }).invitations)).toBe(true);
    });
  });

  describe("POST /api/invitations", () => {
    it("creates invitation and returns 201", async () => {
      const email = `invite-${Date.now()}@example.com`;
      const { status, data } = await post(POST, "/api/invitations", {
        email,
        role: roleId,
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({ email: email.toLowerCase(), role: expect.anything() });
      expect((data as { _id: string })._id).toBeDefined();
    });

    it("rejects duplicate email", async () => {
      const email = `dup-invite-${Date.now()}@example.com`;
      await post(POST, "/api/invitations", { email, role: roleId });
      const { status } = await post(POST, "/api/invitations", { email, role: roleId });
      expect(status).toBe(400);
    });

    it("rejects when user already exists", async () => {
      await connectDB();
      const existing = await User.findOne();
      if (!existing) return;
      const { status } = await post(POST, "/api/invitations", {
        email: existing.email,
        role: roleId,
      });
      expect(status).toBe(400);
    });
  });

  describe("DELETE /api/invitations/[id]", () => {
    it("cancels invitation", async () => {
      const email = `cancel-${Date.now()}@example.com`;
      const { data: created } = await post(POST, "/api/invitations", {
        email,
        role: roleId,
      });
      const id = (created as { _id: string })._id;
      const { status } = await del(
        async (req, ctx) => {
          const { DELETE } = await import("@/app/api/invitations/[id]/route");
          return DELETE(req, ctx);
        },
        "/api/invitations",
        id
      );
      expect(status).toBe(200);
      const remaining = await Invitation.findById(id);
      expect(remaining).toBeNull();
    });
  });
});
