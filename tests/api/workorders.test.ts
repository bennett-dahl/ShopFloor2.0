import { describe, it, expect, beforeAll } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/workorders/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/workorders/[id]/route";
import { PATCH as PATCH_STATUS } from "@/app/api/workorders/[id]/status/route";
import { get, post, put, getById, del, patchStatus } from "../helpers/request";
import { POST as POST_CUSTOMER } from "@/app/api/customers/route";
import { POST as POST_VEHICLE } from "@/app/api/vehicles/route";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/models/User";

async function createCustomerAndVehicle() {
  const { data: customer } = await post(POST_CUSTOMER, "/api/customers", {
    firstName: "WorkOrder",
    lastName: "Customer",
    email: "wo.customer@example.com",
    phone: "555-5555",
  });
  const customerId = (customer as { _id: string })._id;
  const { data: vehicle } = await post(POST_VEHICLE, "/api/vehicles", {
    customer: customerId,
    make: "Ford",
    model: "F-150",
    year: 2021,
  });
  return (vehicle as { _id: string })._id;
}

describe("Work Orders API", () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const testUserId = new mongoose.Types.ObjectId("000000000000000000000001");

  beforeAll(async () => {
    await connectDB();
    await User.findOneAndUpdate(
      { _id: testUserId },
      {
        googleId: "test-google-id",
        email: "test@test.com",
        name: "Test User",
        role: "technician",
      },
      { upsert: true, new: true }
    );
  });

  describe("GET /api/workorders", () => {
    it("returns empty list initially", async () => {
      const { status, data } = await get(GET, "/api/workorders");
      expect(status).toBe(200);
      expect(data).toMatchObject({ workOrders: [], total: 0 });
    });
  });

  describe("POST /api/workorders", () => {
    it("returns 400 when vehicle not found", async () => {
      const { status } = await post(POST, "/api/workorders", {
        vehicle: validId,
        workType: "maintenance",
        description: "Test",
        mileageAtService: 10000,
        status: "scheduled",
      });
      expect(status).toBe(400);
    });

    it("creates work order with customer derived from vehicle", async () => {
      const vehicleId = await createCustomerAndVehicle();
      const { status, data } = await post(POST, "/api/workorders", {
        vehicle: vehicleId,
        workType: "maintenance",
        description: "Oil change",
        mileageAtService: 15000,
        workOrderDate: new Date().toISOString(),
        status: "scheduled",
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({
        workType: "maintenance",
        description: "Oil change",
        status: "scheduled",
      });
      expect((data as { customer: unknown }).customer).toBeDefined();
      expect((data as { totalCost: number }).totalCost).toBeDefined();
      expect(data._id).toBeDefined();
    });
  });

  describe("GET /api/workorders/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/workorders", validId);
      expect(status).toBe(404);
    });
  });

  describe("PUT /api/workorders/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const vehicleId = await createCustomerAndVehicle();
      const { status } = await put(PUT, "/api/workorders", validId, {
        vehicle: vehicleId,
        workType: "repair",
        description: "Test",
        mileageAtService: 1000,
        status: "scheduled",
      });
      expect(status).toBe(404);
    });
  });

  describe("PATCH /api/workorders/[id]/status", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await patchStatus(
        PATCH_STATUS,
        "/api/workorders",
        validId,
        { status: "completed" }
      );
      expect(status).toBe(404);
    });
  });

  describe("DELETE /api/workorders/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await del(DELETE, "/api/workorders", validId);
      expect(status).toBe(404);
    });
  });
});
