import handler from "../pages/api/user/sync";
import { createMocks } from "node-mocks-http";
import { PrismaClient } from "@prisma/client";

// Mock the Webhook class
jest.mock("svix", () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: jest
      .fn()
      .mockImplementation((payload) => {
        const parsedPayload = JSON.parse(payload);
        if (parsedPayload.type === "user.created") {
          return {
            type: "user.created",
            data: {
              id: "test-user-id",
              email_addresses: [{ email_address: "test@example.com" }],
              first_name: "Test",
              last_name: "User",
            },
          };
        }
        if (parsedPayload.type === "user.deleted") {
          return {
            type: "user.deleted",
            data: {
              id: "test-user-id",
            },
          };
        }
        throw new Error("Unexpected webhook type");
      }),
  })),
}));

const prisma = new PrismaClient();

describe("Webhook Handler", () => {
  beforeEach(async () => {
    // Ensure the test user does not already exist
    await prisma.user.deleteMany({ where: { id: "test-user-id" } });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { id: "test-user-id" } });
    // Disconnect Prisma after tests to prevent memory leaks
    await prisma.$disconnect();
  });

  it("should handle user creation and deletion events", async () => {
    // Simulate user creation webhook
    const createPayload = {
      type: "user.created",
      data: {
        id: "test-user-id",
        email_addresses: [{ email_address: "test@example.com" }],
        first_name: "Test",
        last_name: "User",
      },
    };

    const { req: createReq, res: createRes } = createMocks({
      method: "POST",
      body: createPayload,
      headers: {
        "svix-id": "mock-id",
        "svix-timestamp": "mock-timestamp",
        "svix-signature": "mock-signature",
      },
    });

    await handler(createReq, createRes);

    // Validate creation response
    expect(createRes._getStatusCode()).toBe(200);
    expect(createRes._getJSONData()).toEqual({ success: true });

    // Check that the user was created in the database
    const createdUser = await prisma.user.findUnique({
      where: { id: "test-user-id" },
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser).toMatchObject({
      id: "test-user-id",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      username: "test", // Username derived from email
      credits: 0,
    });

    // Simulate user deletion webhook
    const deletePayload = {
      type: "user.deleted",
      data: { id: "test-user-id" },
    };

    const { req: deleteReq, res: deleteRes } = createMocks({
      method: "POST",
      body: deletePayload,
      headers: {
        "svix-id": "mock-id",
        "svix-timestamp": "mock-timestamp",
        "svix-signature": "mock-signature",
      },
    });

    await handler(deleteReq, deleteRes);

    // Validate deletion response
    expect(deleteRes._getStatusCode()).toBe(200);
    expect(deleteRes._getJSONData()).toEqual({ success: true });

    // Check that the user was deleted from the database
    const deletedUser = await prisma.user.findUnique({
      where: { id: "test-user-id" },
    });

    expect(deletedUser).toBeNull(); // User should no longer exist
  });
});
