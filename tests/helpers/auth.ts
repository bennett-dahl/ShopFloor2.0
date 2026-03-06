import { vi } from "vitest";
import { NextResponse } from "next/server";

const mockSession = {
  user: {
    id: "000000000000000000000001",
    name: "Test User",
    email: "test@test.com",
    roleId: "000000000000000000000002",
  },
};

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(() => Promise.resolve(mockSession)),
  authOptions: {},
}));

vi.mock("@/lib/api-auth", async () => {
  const auth = await import("@/lib/auth");
  return {
    requireAuth: vi.fn(async () => {
      const session = await auth.getAuthSession();
      if (!session?.user?.id) {
        return NextResponse.json(
          { message: "No token, authorization denied" },
          { status: 401 }
        );
      }
      return { session };
    }),
    requirePermissionForMethod: vi.fn(async () => {
      const session = await auth.getAuthSession();
      if (!session?.user?.id) {
        return NextResponse.json(
          { message: "No token, authorization denied" },
          { status: 401 }
        );
      }
      return { session };
    }),
  };
});

export { mockSession };
