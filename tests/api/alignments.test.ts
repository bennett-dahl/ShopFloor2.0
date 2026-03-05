import { describe, it, expect } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/alignments/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/alignments/[id]/route";
import { get, post, put, getById, del } from "../helpers/request";
import { POST as POST_CUSTOMER } from "@/app/api/customers/route";
import { POST as POST_VEHICLE } from "@/app/api/vehicles/route";
import mongoose from "mongoose";

async function createVehicle() {
  const { data: customer } = await post(POST_CUSTOMER, "/api/customers", {
    firstName: "Align",
    lastName: "Customer",
    email: `align-${Date.now()}@example.com`,
    phone: "555-0000",
  });
  const customerId = (customer as { _id: string })._id;
  const { data: vehicle } = await post(POST_VEHICLE, "/api/vehicles", {
    customer: customerId,
    make: "Porsche",
    model: "911",
    year: 2021,
  });
  return (vehicle as { _id: string })._id;
}

const emptySnapshot = {};

describe("Alignments API", () => {
  const validId = new mongoose.Types.ObjectId().toString();

  describe("GET /api/alignments", () => {
    it("returns empty list initially", async () => {
      const { status, data } = await get(GET, "/api/alignments");
      expect(status).toBe(200);
      expect(data).toMatchObject({ alignments: [], total: 0 });
    });
  });

  describe("POST /api/alignments", () => {
    it("creates alignment and returns 201", async () => {
      const vehicleId = await createVehicle();
      const { status, data } = await post(POST, "/api/alignments", {
        vehicle: vehicleId,
        alignmentType: "custom",
        before: emptySnapshot,
        after: emptySnapshot,
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({
        alignmentType: "custom",
      });
      expect((data as { _id: string })._id).toBeDefined();
      expect((data as { vehicle: unknown }).vehicle).toBeDefined();
    });

    it("creates alignment with accuracyRating and customerRating and returns them", async () => {
      const vehicleId = await createVehicle();
      const { status, data } = await post(POST, "/api/alignments", {
        vehicle: vehicleId,
        alignmentType: "custom",
        before: emptySnapshot,
        after: emptySnapshot,
        accuracyRating: 3,
        customerRating: 4,
      });
      expect(status).toBe(201);
      expect((data as { accuracyRating: number }).accuracyRating).toBe(3);
      expect((data as { customerRating: number }).customerRating).toBe(4);
      const id = (data as { _id: string })._id;
      const { data: fetched } = await getById(GET_ID, "/api/alignments", id);
      expect((fetched as { accuracyRating: number }).accuracyRating).toBe(3);
      expect((fetched as { customerRating: number }).customerRating).toBe(4);
    });
  });

  describe("GET /api/alignments/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/alignments", validId);
      expect(status).toBe(404);
    });
  });

  describe("GET /api/alignments with vehicleId (last alignment)", () => {
    it("returns last alignment for vehicle when limit=1", async () => {
      const vehicleId = await createVehicle();
      await post(POST, "/api/alignments", {
        vehicle: vehicleId,
        alignmentType: "custom",
        before: emptySnapshot,
        after: emptySnapshot,
      });
      const { status, data } = await get(GET, "/api/alignments", {
        vehicleId,
        limit: "1",
      });
      expect(status).toBe(200);
      expect((data as { alignments: unknown[] }).alignments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("PUT /api/alignments/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const vehicleId = await createVehicle();
      const { status } = await put(PUT, "/api/alignments", validId, {
        vehicle: vehicleId,
        alignmentType: "custom",
        before: emptySnapshot,
        after: emptySnapshot,
      });
      expect(status).toBe(404);
    });

    it("updates accuracyRating and customerRating and returns them", async () => {
      const vehicleId = await createVehicle();
      const { data: created } = await post(POST, "/api/alignments", {
        vehicle: vehicleId,
        alignmentType: "custom",
        before: emptySnapshot,
        after: emptySnapshot,
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await put(PUT, "/api/alignments", id, {
        vehicle: vehicleId,
        alignmentType: "custom",
        before: emptySnapshot,
        after: emptySnapshot,
        accuracyRating: 5,
        customerRating: 2,
      });
      expect(status).toBe(200);
      expect((data as { accuracyRating: number }).accuracyRating).toBe(5);
      expect((data as { customerRating: number }).customerRating).toBe(2);
      const { data: fetched } = await getById(GET_ID, "/api/alignments", id);
      expect((fetched as { accuracyRating: number }).accuracyRating).toBe(5);
      expect((fetched as { customerRating: number }).customerRating).toBe(2);
    });
  });

  describe("DELETE /api/alignments/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await del(DELETE, "/api/alignments", validId);
      expect(status).toBe(404);
    });
  });
});
