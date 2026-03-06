import { describe, it, expect } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/roles/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/roles/[id]/route";
import { get, post, put, getById, del } from "../helpers/request";
import mongoose from "mongoose";

describe("Roles API", () => {
  const validId = new mongoose.Types.ObjectId().toString();

  describe("GET /api/roles", () => {
    it("returns list of roles", async () => {
      const { status, data } = await get(GET, "/api/roles");
      expect(status).toBe(200);
      expect(data).toHaveProperty("roles");
      expect(Array.isArray((data as { roles: unknown[] }).roles)).toBe(true);
    });
  });

  describe("POST /api/roles", () => {
    it("creates role and returns 201", async () => {
      const { status, data } = await post(POST, "/api/roles", {
        name: "TestRole",
        permissions: [
          { resource: "customers", read: true, create: false, update: false, delete: false },
        ],
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({ name: "TestRole" });
      expect((data as { _id: string })._id).toBeDefined();
      expect((data as { permissions: unknown[] }).permissions).toBeDefined();
    });

    it("normalizes permissions for all resources", async () => {
      const { status, data } = await post(POST, "/api/roles", {
        name: "PartialPerms",
        permissions: [{ resource: "customers", read: true, create: true }],
      });
      expect(status).toBe(201);
      const perms = (data as { permissions: { resource: string; read: boolean }[] }).permissions;
      expect(perms.length).toBeGreaterThan(1);
      const customers = perms.find((p) => p.resource === "customers");
      expect(customers?.read).toBe(true);
    });
  });

  describe("GET /api/roles/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/roles", validId);
      expect(status).toBe(404);
    });

    it("returns 200 and role when exists", async () => {
      const { data: created } = await post(POST, "/api/roles", {
        name: "GetTestRole",
        permissions: [],
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await getById(GET_ID, "/api/roles", id);
      expect(status).toBe(200);
      expect(data).toMatchObject({ name: "GetTestRole" });
    });
  });

  describe("PUT /api/roles/[id]", () => {
    it("updates role and returns 200", async () => {
      const { data: created } = await post(POST, "/api/roles", {
        name: "PutTestRole",
        permissions: [{ resource: "customers", read: true }],
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await put(PUT, "/api/roles", id, {
        name: "PutTestRoleUpdated",
        permissions: [{ resource: "customers", read: true, create: true }],
      });
      expect(status).toBe(200);
      expect(data).toMatchObject({ name: "PutTestRoleUpdated" });
    });
  });

  describe("DELETE /api/roles/[id]", () => {
    it("deletes role with no users and returns 200", async () => {
      const { data: created } = await post(POST, "/api/roles", {
        name: "DeleteTestRole",
        permissions: [],
      });
      const id = (created as { _id: string })._id;
      const { status } = await del(DELETE, "/api/roles", id);
      expect(status).toBe(200);
      const { status: getStatus } = await getById(GET_ID, "/api/roles", id);
      expect(getStatus).toBe(404);
    });
  });
});
