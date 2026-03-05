import { describe, it, expect } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/alignment-templates/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/alignment-templates/[id]/route";
import { get, post, put, getById, del } from "../helpers/request";
import { POST as POST_SETTING } from "@/app/api/settings/route";
import mongoose from "mongoose";

async function createAlignmentType() {
  const { data } = await post(POST_SETTING, "/api/settings", {
    category: "alignmentType",
    name: `TestType-${Date.now()}`,
  });
  return (data as { name: string }).name;
}

describe("Alignment Templates API", () => {
  const validId = new mongoose.Types.ObjectId().toString();
  const emptyTarget = {};

  describe("GET /api/alignment-templates", () => {
    it("returns empty list initially", async () => {
      const { status, data } = await get(GET, "/api/alignment-templates");
      expect(status).toBe(200);
      expect(data).toMatchObject({ templates: [], total: 0 });
    });
  });

  describe("POST /api/alignment-templates", () => {
    it("creates template and returns 201", async () => {
      const alignmentType = await createAlignmentType();
      const { status, data } = await post(POST, "/api/alignment-templates", {
        make: "Porsche",
        model: "911",
        year: "2021",
        alignmentType,
        target: emptyTarget,
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({
        make: "Porsche",
        model: "911",
        year: "2021",
        alignmentType,
      });
      expect((data as { _id: string })._id).toBeDefined();
    });

    it("persists and returns non-empty target snapshot", async () => {
      const alignmentType = await createAlignmentType();
      const targetWithCorners = {
        fl: { camber: -1.2, toe: 2, rideHeight: 140, weightPercent: 25 },
        totalWeightLbs: 3200,
        frontAxlePercent: 48,
        rearAxlePercent: 52,
      };
      const { status, data } = await post(POST, "/api/alignment-templates", {
        make: "BMW",
        model: "M3",
        year: "2022",
        alignmentType,
        target: targetWithCorners,
      });
      expect(status).toBe(201);
      const id = (data as { _id: string })._id;
      const { status: getStatus, data: fetched } = await getById(GET_ID, "/api/alignment-templates", id);
      expect(getStatus).toBe(200);
      expect((fetched as { target: { fl?: { camber?: number }; totalWeightLbs?: number } }).target?.fl?.camber).toBe(-1.2);
      expect((fetched as { target: { totalWeightLbs?: number } }).target?.totalWeightLbs).toBe(3200);
      expect((fetched as { target: { frontAxlePercent?: number } }).target?.frontAxlePercent).toBe(48);
    });
  });

  describe("GET /api/alignment-templates/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/alignment-templates", validId);
      expect(status).toBe(404);
    });
  });

  describe("PUT /api/alignment-templates/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const alignmentType = await createAlignmentType();
      const { status } = await put(PUT, "/api/alignment-templates", validId, {
        make: "X",
        model: "Y",
        year: "",
        alignmentType,
        target: emptyTarget,
      });
      expect(status).toBe(404);
    });
  });

  describe("DELETE /api/alignment-templates/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await del(DELETE, "/api/alignment-templates", validId);
      expect(status).toBe(404);
    });
  });
});
