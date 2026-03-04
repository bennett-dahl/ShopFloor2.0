import { vi } from "vitest";

const mockSession = {
  user: {
    id: "000000000000000000000001",
    name: "Test User",
    email: "test@test.com",
  },
};

vi.mock("@/lib/auth", () => ({
  getAuthSession: vi.fn(() => Promise.resolve(mockSession)),
  authOptions: {},
}));

export { mockSession };
