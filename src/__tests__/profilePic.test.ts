import { getProfilePic, postProfilePic, deleteProfilePic } from "../utils/profilePic";
import fs from "fs";
import path from "path";

describe("Profile Picture Utility - Upload, Fetch, and Delete (Real S3)", () => {
  const id = "testUser"; // ID of the user or entity
  const testImagePath = path.join(process.cwd(), "public", "test-image.jpg");
  let testImageBuffer: Buffer;

  beforeAll(() => {
    // Load test image
    testImageBuffer = fs.readFileSync(testImagePath);
  });

  afterEach(() => {
    jest.clearAllTimers(); // Clear any lingering timers
  });

  it("should upload, fetch, and delete a profile picture from S3", async () => {
    // Step 1: Upload the Profile Picture
    const uploadResponse = await postProfilePic(id, testImageBuffer.toString("base64"), "image/jpeg");

    // Validate the upload response
    expect(uploadResponse).toEqual({
      message: "Profile picture uploaded successfully",
    });

    // Step 2: Fetch the Profile Picture
    const fetchResponse = await getProfilePic(id);

    // Validate the fetch response
    expect(fetchResponse).toMatch(/^https?:\/\/.+/); // Ensure it's a valid URL

    // Step 3: Delete the Profile Picture
    const deleteResponse = await deleteProfilePic(id);

    // Validate the delete response
    expect(deleteResponse).toEqual({
      message: "Profile picture deleted successfully",
    });

    // Step 4: Ensure the image is no longer retrievable
    await expect(getProfilePic(id)).rejects.toThrow("Profile picture not found");
  });
});