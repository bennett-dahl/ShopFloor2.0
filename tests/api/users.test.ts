import { describe, it, expect, beforeAll } from "vitest";
import "../helpers/auth";
import { GET } from "@/app/api/users/route";
import { PATCH } from "@/app/api/users/[id]/route";
import { get } from "../helpers/request";
import { patch } from "../helpers/request";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import User from "@/models/User";
import mongoose from "mongoose";

describe("Users API", () => {
  let roleId: string;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
    let role = await Role.findOne({ name: "Admin" });
    if (!role) {
      role = await Role.create({
        name: "Admin",
        permissions: [{ resource: "users", read: true, create: true, update: true, delete: true }],
      });
    }
    roleId = role._id.toString();
    const user = await User.create({
      googleId: "users-test-google-id",
      email: "users-test@example.com",
      name: "Users Test User",
      role: role._id,
    });
    userId = user._id.toString();
  });

  describe("GET /api/users", () => {
    it("returns list including test user", async () => {
      const { status, data } = await get(GET, "/api/users");
      expect(status).toBe(200);
      expect(data).toHaveProperty("users");
      const users = (data as { users: { _id: string; email: string }[] }).users;
      expect(Array.isArray(users)).toBe(true);
      const found = users.find((u) => u._id === userId || u.email === "users-test@example.com");
      expect(found).toBeDefined();
    });
  });

  describe("PATCH /api/users/[id]", () => {
    it("updates user role", async () => {
      let techRole = await Role.findOne({ name: "Tech" });
      if (!techRole) {
        techRole = await Role.create({
          name: "Tech",
          permissions: [{ resource: "customers", read: true, create: true, update: true, delete: true }],
        });
      }
      const { status, data } = await patch(PATCH, "/api/users", userId, {
        role: techRole._id.toString(),
      });
      expect(status).toBe(200);
      expect((data as { role: { name: string } }).role?.name).toBe("Tech");
      const { data: updated } = await get(GET, "/api/users");
      const users = (updated as { users: { _id: string; role: { name: string } }[] }).users;
      const u = users.find((x) => x._id === userId);
      expect(u?.role?.name).toBe("Tech");
    });
  });
});
