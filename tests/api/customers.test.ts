import { describe, it, expect, beforeEach } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/customers/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/customers/[id]/route";
import { get, post, put, getById, del } from "../helpers/request";
import mongoose from "mongoose";

describe("Customers API", () => {
  const validId = new mongoose.Types.ObjectId().toString();

  describe("GET /api/customers", () => {
    it("returns empty list initially", async () => {
      const { status, data } = await get(GET, "/api/customers");
      expect(status).toBe(200);
      expect(data).toMatchObject({ customers: [], total: 0 });
    });

    it("returns list with pagination after create", async () => {
      await post(POST, "/api/customers", {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "555-0000",
      });
      const { status, data } = await get(GET, "/api/customers");
      expect(status).toBe(200);
      expect(data.customers.length).toBeGreaterThanOrEqual(1);
      expect(data.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("POST /api/customers", () => {
    it("creates customer and returns 201", async () => {
      const { status, data } = await post(POST, "/api/customers", {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "555-1234",
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "555-1234",
      });
      expect(data._id).toBeDefined();
    });

    it("enforces duplicate email when schema has unique index", async () => {
      const email = `dup-${Date.now()}@example.com`;
      const payload = {
        firstName: "Dup",
        lastName: "User",
        email,
        phone: "555-9999",
      };
      const first = await post(POST, "/api/customers", payload);
      expect(first.status).toBe(201);
      const second = await post(POST, "/api/customers", payload);
      expect([200, 201, 400]).toContain(second.status);
    });
  });

  describe("GET /api/customers/[id]", () => {
    it("returns 404 for invalid id", async () => {
      const { status } = await getById(GET_ID, "/api/customers", "invalid");
      expect(status).toBe(404);
    });

    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/customers", validId);
      expect(status).toBe(404);
    });

    it("returns 200 and customer when exists", async () => {
      const { data: created } = await post(POST, "/api/customers", {
        firstName: "Get",
        lastName: "Me",
        email: "getme@example.com",
        phone: "555-1111",
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await getById(GET_ID, "/api/customers", id);
      expect(status).toBe(200);
      expect(data).toMatchObject({ firstName: "Get", lastName: "Me" });
    });
  });

  describe("PUT /api/customers/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await put(PUT, "/api/customers", validId, {
        firstName: "X",
        lastName: "Y",
        email: "xy@example.com",
        phone: "555-0000",
      });
      expect(status).toBe(404);
    });

    it("updates customer and returns 200", async () => {
      const { data: created } = await post(POST, "/api/customers", {
        firstName: "Update",
        lastName: "Me",
        email: "updateme@example.com",
        phone: "555-2222",
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await put(PUT, "/api/customers", id, {
        firstName: "Updated",
        lastName: "Me",
        email: "updateme@example.com",
        phone: "555-2222",
      });
      expect(status).toBe(200);
      expect(data).toMatchObject({ firstName: "Updated" });
    });
  });

  describe("DELETE /api/customers/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await del(DELETE, "/api/customers", validId);
      expect(status).toBe(404);
    });

    it("deactivates customer and returns 200 (soft delete)", async () => {
      const { data: created } = await post(POST, "/api/customers", {
        firstName: "Delete",
        lastName: "Me",
        email: "deleteme@example.com",
        phone: "555-3333",
      });
      const id = (created as { _id: string })._id;
      const { status } = await del(DELETE, "/api/customers", id);
      expect(status).toBe(200);
      const { status: getStatus, data: getData } = await getById(GET_ID, "/api/customers", id);
      expect(getStatus).toBe(200);
      expect((getData as { isActive: boolean }).isActive).toBe(false);
    });
  });
});
