import { describe, it, expect, vi } from "vitest";
import "../helpers/auth";
import { getAuthSession } from "@/lib/auth";
import { GET } from "@/app/api/customers/route";
import { get } from "../helpers/request";

describe("Auth", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null as never);
    const { status } = await get(GET, "/api/customers");
    expect(status).toBe(401);
  });

  it("returns 200 when authenticated", async () => {
    const { status } = await get(GET, "/api/customers");
    expect(status).toBe(200);
  });
});
