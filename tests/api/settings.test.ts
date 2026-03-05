import { describe, it, expect } from "vitest";
import "../helpers/auth";
import { GET, POST } from "@/app/api/settings/route";
import { GET as GET_ID, PUT, DELETE } from "@/app/api/settings/[id]/route";
import { get, post, put, getById, del } from "../helpers/request";
import mongoose from "mongoose";

describe("Settings API", () => {
  const validId = new mongoose.Types.ObjectId().toString();

  describe("GET /api/settings", () => {
    it("returns empty list initially when filtered by category", async () => {
      const { status, data } = await get(GET, "/api/settings", {
        category: "alignmentType",
      });
      expect(status).toBe(200);
      expect(data).toMatchObject({ settings: [], total: 0 });
    });

    it("returns list with data after create", async () => {
      await post(POST, "/api/settings", {
        category: "alignmentType",
        name: "Aggressive",
      });
      const { status, data } = await get(GET, "/api/settings", {
        category: "alignmentType",
      });
      expect(status).toBe(200);
      expect((data as { settings: unknown[] }).settings.length).toBeGreaterThanOrEqual(1);
      expect((data as { total: number }).total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("POST /api/settings", () => {
    it("creates setting and returns 201", async () => {
      const { status, data } = await post(POST, "/api/settings", {
        category: "rideHeightReference",
        name: "Wheel center to fender",
      });
      expect(status).toBe(201);
      expect(data).toMatchObject({
        category: "rideHeightReference",
        name: "Wheel center to fender",
      });
      expect((data as { _id: string })._id).toBeDefined();
    });
  });

  describe("GET /api/settings/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await getById(GET_ID, "/api/settings", validId);
      expect(status).toBe(404);
    });

    it("returns 200 and setting when exists", async () => {
      const { data: created } = await post(POST, "/api/settings", {
        category: "alignmentType",
        name: "Neutral",
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await getById(GET_ID, "/api/settings", id);
      expect(status).toBe(200);
      expect(data).toMatchObject({ name: "Neutral", category: "alignmentType" });
    });
  });

  describe("PUT /api/settings/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await put(PUT, "/api/settings", validId, {
        category: "alignmentType",
        name: "Custom",
      });
      expect(status).toBe(404);
    });

    it("updates setting and returns 200", async () => {
      const { data: created } = await post(POST, "/api/settings", {
        category: "alignmentType",
        name: "Track",
      });
      const id = (created as { _id: string })._id;
      const { status, data } = await put(PUT, "/api/settings", id, {
        category: "alignmentType",
        name: "Track Day",
      });
      expect(status).toBe(200);
      expect(data).toMatchObject({ name: "Track Day" });
    });
  });

  describe("DELETE /api/settings/[id]", () => {
    it("returns 404 for non-existent id", async () => {
      const { status } = await del(DELETE, "/api/settings", validId);
      expect(status).toBe(404);
    });

    it("deletes setting and returns 200", async () => {
      const { data: created } = await post(POST, "/api/settings", {
        category: "alignmentType",
        name: "ToDelete",
      });
      const id = (created as { _id: string })._id;
      const { status } = await del(DELETE, "/api/settings", id);
      expect(status).toBe(200);
      const { status: getStatus } = await getById(GET_ID, "/api/settings", id);
      expect(getStatus).toBe(404);
    });
  });
});
