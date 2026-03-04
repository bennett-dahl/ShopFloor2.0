import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 and status OK", async () => {
    const res = await GET(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ status: "OK", message: expect.any(String) });
  });
});
