import { createMocks } from "node-mocks-http";
import getUserDetails from "../../pages/api/user/userDetails";
import { initializeTestUser, cleanupTestUser } from "../../utils/testing/testHelper";




describe("Clerk Webhook Sync Tests with Image URL", () => {
  const TEST_USER_ID = "clerk_test_user_id_no_image";
  const TEST_EMAIL = "test+clerk_test_user_id_no_image@example.com";
  const SIGNING_SECRET = process.env.SIGNING_SECRET as string; // Add your Clerk Signing Secret

  beforeAll(async () => {
    await initializeTestUser({
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      signingSecret: SIGNING_SECRET,
      hasImage: false,
      imageUrl: null,
    });
  });

  afterAll(async () => {
    await cleanupTestUser({
      userId: TEST_USER_ID,
      signingSecret: SIGNING_SECRET,
    });
  });
  it("Checks profilePicUrl for valid format", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { id: TEST_USER_ID },
    });

    // Call the getUserDetails handler
    await getUserDetails(req, res);

    // Ensure the status code is 200
    expect(res._getStatusCode()).toBe(200);

    // Parse the response data
    const data = JSON.parse(res._getData());

    // Validate the profilePicUrl
    expect(data).toMatchObject({
      firstName: "Test",
      lastName: "User",
      email: TEST_EMAIL,
      profilePicUrl: null, // Ensure valid URL format ending in .jpg
    });
  });
});