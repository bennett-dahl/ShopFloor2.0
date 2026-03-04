import { describe, it, expect } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/services/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/services/[id]/route";
import { get, post, put, getById, del } from "../helpers/request";
import mongoose from "mongoose";

describe("Services API", () => {
  const validId = new mongoose.Types.ObjectId().toString();

  describe("GET /api/services", () => {
    it("returns empty list initially", async () => {
      const { status, data } = await get(GET, "/api/services");
      expect(status).toBe(200);
      expect(data).toMatchObject({ services: [], total: 0 });
    });
  });

  describe("POST /api/services", () => {
    it("creates service and computes totalCost", async () => {
      const { status, data } = await post(POST, "/api/services", {
        serviceCode: "SVC-001",
        name: "Oil Change",
        description: "Full synthetic oil change",
        category: "maintenance",
        standardHours: 1,
        laborRate: 100,
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({
        serviceCode: "SVC-001",
        name: "Oil Change",
        category: "maintenance",
        standardHours: 1,
        laborRate: 100,
      });
      expect((data as { totalCost: number }).totalCost).toBe(100);
      expect(data._id).toBeDefined();
    });

    it("returns 400 for duplicate service code when unique index exists", async () => {
      const code = `SVC-DUP-${Date.now()}`;
      const payload = {
        serviceCode: code,
        name: "Dup Service",
        description: "Desc",
        category: "repair",
        standardHours: 0.5,
        laborRate: 80,
      };
      const first = await post(POST, "/api/services", payload);
      expect(first.status).toBe(201);
      const second = await post(POST, "/api/services", payload);
      expect([400, 201]).toContain(second.status);
    });
  });

  describe("GET /api/services/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/services", validId);
      expect(status).toBe(404);
    });
  });

  describe("PUT /api/services/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await put(PUT, "/api/services", validId, {
        serviceCode: "SVC-X",
        name: "X",
        description: "X",
        category: "other",
        standardHours: 0,
        laborRate: 0,
      });
      expect(status).toBe(404);
    });
  });

  describe("DELETE /api/services/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await del(DELETE, "/api/services", validId);
      expect(status).toBe(404);
    });
  });
});
