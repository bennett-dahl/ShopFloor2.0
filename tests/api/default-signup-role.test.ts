import { describe, it, expect, beforeAll } from "vitest";
import "../helpers/auth";
import { GET, PATCH } from "@/app/api/settings/default-signup-role/route";
import { POST } from "@/app/api/roles/route";
import { get, post, patchPath } from "../helpers/request";
import connectDB from "@/lib/db";

describe("Default signup role API", () => {
  beforeAll(async () => {
    await connectDB();
  });

  describe("GET /api/settings/default-signup-role", () => {
    it("returns roleId null when not set", async () => {
      const { status, data } = await get(
        GET,
        "/api/settings/default-signup-role"
      );
      expect(status).toBe(200);
      expect(data).toHaveProperty("roleId");
      expect((data as { roleId: string | null }).roleId).toBeNull();
    });
  });

  describe("PATCH /api/settings/default-signup-role", () => {
    it("sets and clears default signup role", async () => {
      const { data: roleData } = await post(POST, "/api/roles", {
        name: "DefaultSignupTestRole",
        permissions: [],
      });
      const roleId = (roleData as { _id: string })._id;

      const { status: setStatus, data: setData } = await patchPath(
        PATCH,
        "/api/settings/default-signup-role",
        { roleId }
      );
      expect(setStatus).toBe(200);
      expect((setData as { roleId: string }).roleId).toBe(roleId);

      const { data: getData } = await get(
        GET,
        "/api/settings/default-signup-role"
      );
      expect((getData as { roleId: string | null }).roleId).toBe(roleId);

      const { status: clearStatus, data: clearData } = await patchPath(
        PATCH,
        "/api/settings/default-signup-role",
        { roleId: "" }
      );
      expect(clearStatus).toBe(200);
      expect((clearData as { roleId: null }).roleId).toBeNull();
    });

    it("returns 400 for invalid role id", async () => {
      const { status } = await patchPath(
        PATCH,
        "/api/settings/default-signup-role",
        { roleId: "invalid" }
      );
      expect(status).toBe(400);
    });
  });
});
