import { describe, it, expect } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/vehicles/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/vehicles/[id]/route";
import { get, post, put, getById, del } from "../helpers/request";
import { POST as POST_CUSTOMER } from "@/app/api/customers/route";
import mongoose from "mongoose";

async function createCustomer() {
  const { data } = await post(POST_CUSTOMER, "/api/customers", {
    firstName: "Vehicle",
    lastName: "Owner",
    email: "vehicle.owner@example.com",
    phone: "555-4444",
  });
  return (data as { _id: string })._id;
}

describe("Vehicles API", () => {
  const validId = new mongoose.Types.ObjectId().toString();

  describe("GET /api/vehicles", () => {
    it("returns empty list initially", async () => {
      const { status, data } = await get(GET, "/api/vehicles");
      expect(status).toBe(200);
      expect(data).toMatchObject({ vehicles: [], total: 0 });
    });
  });

  describe("POST /api/vehicles", () => {
    it("returns 400 when customer not found", async () => {
      const { status } = await post(POST, "/api/vehicles", {
        customer: validId,
        make: "Toyota",
        model: "Camry",
        year: 2020,
      });
      expect(status).toBe(400);
    });

    it("creates vehicle and returns 201", async () => {
      const customerId = await createCustomer();
      const { status, data } = await post(POST, "/api/vehicles", {
        customer: customerId,
        make: "Honda",
        model: "Civic",
        year: 2022,
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({
        make: "Honda",
        model: "Civic",
        year: 2022,
      });
      expect(data._id).toBeDefined();
    });
  });

  describe("GET /api/vehicles/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/vehicles", validId);
      expect(status).toBe(404);
    });
  });

  describe("PUT /api/vehicles/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const customerId = await createCustomer();
      const { status } = await put(PUT, "/api/vehicles", validId, {
        customer: customerId,
        make: "X",
        model: "Y",
        year: 2020,
      });
      expect(status).toBe(404);
    });
  });

  describe("DELETE /api/vehicles/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await del(DELETE, "/api/vehicles", validId);
      expect(status).toBe(404);
    });
  });
});
