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
import Role from "@/models/Role";

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
    let role = await Role.findOne({ name: "Admin" });
    if (!role) {
      role = await Role.create({
        name: "Admin",
        permissions: [
          { resource: "workorders", read: true, create: true, update: true, delete: true },
        ],
      });
    }
    await User.findOneAndUpdate(
      { _id: testUserId },
      {
        googleId: "test-google-id",
        email: "test@test.com",
        name: "Test User",
        role: role._id,
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

    it("returns work orders with workOrderNumber in list", async () => {
      const vehicleId = await createCustomerAndVehicle();
      await post(POST, "/api/workorders", {
        vehicle: vehicleId,
        workType: "maintenance",
        description: "List test",
        mileageAtService: 3000,
        status: "scheduled",
      });
      const { status, data } = await get(GET, "/api/workorders");
      expect(status).toBe(200);
      const list = (data as { workOrders: { workOrderNumber?: string }[] }).workOrders;
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].workOrderNumber).toBeDefined();
      expect(list[0].workOrderNumber).toMatch(/^WO-\d{4}$/);
    });

    it("finds work order by search on workOrderNumber", async () => {
      const vehicleId = await createCustomerAndVehicle();
      const { data: created } = await post(POST, "/api/workorders", {
        vehicle: vehicleId,
        workType: "inspection",
        description: "Search by number",
        mileageAtService: 4000,
        status: "scheduled",
      });
      const woNum = (created as { workOrderNumber: string }).workOrderNumber;
      const { status, data } = await get(GET, "/api/workorders", { search: woNum });
      expect(status).toBe(200);
      const list = (data as { workOrders: { workOrderNumber: string }[] }).workOrders;
      expect(list.some((wo) => wo.workOrderNumber === woNum)).toBe(true);
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
      expect((data as { workOrderNumber: string }).workOrderNumber).toBeDefined();
      expect((data as { workOrderNumber: string }).workOrderNumber).toMatch(/^WO-\d{4}$/);
      expect((data as { customer: unknown }).customer).toBeDefined();
      expect((data as { totalCost: number }).totalCost).toBeDefined();
      expect((data as { _id: string })._id).toBeDefined();
    });

    it("assigns sequential work order numbers", async () => {
      const vehicleId = await createCustomerAndVehicle();
      const { data: first } = await post(POST, "/api/workorders", {
        vehicle: vehicleId,
        workType: "maintenance",
        description: "First",
        mileageAtService: 1000,
        status: "scheduled",
      });
      const { data: second } = await post(POST, "/api/workorders", {
        vehicle: vehicleId,
        workType: "repair",
        description: "Second",
        mileageAtService: 2000,
        status: "scheduled",
      });
      const n1 = parseInt((first as { workOrderNumber: string }).workOrderNumber.replace(/^WO-/, ""), 10);
      const n2 = parseInt((second as { workOrderNumber: string }).workOrderNumber.replace(/^WO-/, ""), 10);
      expect(n2).toBe(n1 + 1);
    });
  });

  describe("GET /api/workorders/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/workorders", validId);
      expect(status).toBe(404);
    });

    it("returns work order with workOrderNumber when exists", async () => {
      const vehicleId = await createCustomerAndVehicle();
      const { data: created } = await post(POST, "/api/workorders", {
        vehicle: vehicleId,
        workType: "maintenance",
        description: "Get test",
        mileageAtService: 5000,
        status: "scheduled",
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await getById(GET_ID, "/api/workorders", id);
      expect(status).toBe(200);
      expect((data as { workOrderNumber: string }).workOrderNumber).toBeDefined();
      expect((data as { workOrderNumber: string }).workOrderNumber).toMatch(/^WO-\d{4}$/);
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
