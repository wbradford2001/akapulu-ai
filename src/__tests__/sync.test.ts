import syncHandler from "../pages/api/user/sync";
import { getProfilePic } from "../utils/profilePic";
import handler from "../pages/api/user/[id]";
import { createMocks } from "node-mocks-http";
import { PrismaClient } from "@prisma/client";
import http from "http";
import path from "path";
import { promisify } from "util";
import handlerStatic from "serve-handler";

jest.mock("svix", () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: jest.fn().mockImplementation((payload) => {
      const parsedPayload = JSON.parse(payload);
      if (parsedPayload.type === "user.created") {
        return {
          type: "user.created",
          data: {
            id: "test-user-id",
            email_addresses: [{ email_address: "test@example.com" }],
            image_url: `http://localhost:3001/test-image.jpg`,
          },
        };
      }
      if (parsedPayload.type === "user.deleted") {
        return {
          type: "user.deleted",
          data: { id: "test-user-id" },
        };
      }
      throw new Error("Unexpected webhook type");
    }),
  })),
}));

const prisma = new PrismaClient();
let server: http.Server;

beforeAll(async () => {
  // Start static file server
  server = http.createServer((req, res) => {
    handlerStatic(req, res, { public: path.join(process.cwd(), "public") });
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(3001, (err?: Error) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

afterAll(async () => {
  // Disconnect Prisma and close server
  try {
    await prisma.user.deleteMany({ where: { id: "test-user-id" } });
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during Prisma disconnect:", error);
  }

  if (server) {
    try {
      await promisify(server.close.bind(server))();
    } catch (error) {
      console.error("Error during server close:", error);
    }
  }
});

afterEach(() => {
  jest.clearAllTimers(); // Clear lingering timers
  jest.clearAllMocks(); // Clear mocks to prevent cross-test interference
});

describe("Webhook Handler", () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.user.deleteMany({ where: { id: "test-user-id" } });
  });

  it("should handle user creation, fetch profile picture, and deletion events", async () => {

    // Simulate user creation webhook
    const createPayload = {
      type: "user.created",
      data: {
        id: "test-user-id",
        email_addresses: [{ email_address: "test@example.com" }],
        image_url: `http://localhost:3001/test-image.jpg`,
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

    await syncHandler(createReq, createRes);

    // Verify successful creation
    expect(createRes._getStatusCode()).toBe(200);
    expect(createRes._getJSONData()).toEqual({ success: true });

    // Validate profile picture exists
    const fetchedImage = await getProfilePic("test-user-id");
    expect(fetchedImage).toMatch(/^https?:\/\/.+/); // Ensure URL format

    // Step 3: Call the `user/[id]` API
    const { req, res } = createMocks({
      method: "GET",
      query: { id: "test-user-id" },
    });

    await handler(req, res);

    // Validate the response
    expect(res._getStatusCode()).toBe(200);

    const responseData = res._getJSONData();

    // Verify the username and profile picture URL
    expect(responseData.username).toBe("test");
    expect(responseData.profilePicture).toMatch(/^https?:\/\/.+/); // Check profile picture URL

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

    await syncHandler(deleteReq, deleteRes);

    // Validate deletion response
    expect(deleteRes._getStatusCode()).toBe(200);
    expect(deleteRes._getJSONData()).toEqual({ success: true });

  });
});