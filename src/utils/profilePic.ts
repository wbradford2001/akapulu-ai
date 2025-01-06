import { s3Client } from "./s3";
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

/**
 * Fetches the profile picture URL from S3.
 */
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function getProfilePic(id: string): Promise<string> {
  const bucketName = process.env.BUCKET_URL as string; // Ensure this contains your bucket name
  const objectKey = `${id}/profile-picture.jpg`;

  try {
    // Generate a pre-signed URL for the object
    const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour
    console.log(signedUrl)
    return signedUrl;
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      throw new Error("Profile picture not found");
    }
    throw error;
  }
}

/**
 * Uploads a profile picture to S3 after resizing.
 */
export async function postProfilePic(id: string, image: string, contentType: string) {
  const bucketName = process.env.BUCKET_URL as string;
  const objectKey = `${id}/profile-picture.jpg`;

  if (!image || !contentType) {
    throw new Error("Missing image or contentType");
  }

  const buffer = Buffer.from(image, "base64");
  const resizedImageBuffer = await sharp(buffer)
    .resize({ width: 128, height: 128, fit: "inside" }) // Resize to 128x128
    .toBuffer();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: resizedImageBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return { message: "Profile picture uploaded successfully" };
}

/**
 * Deletes a profile picture from S3.
 */
export async function deleteProfilePic(id: string) {
  const bucketName = process.env.BUCKET_URL as string;
  const objectKey = `${id}/profile-picture.jpg`;

  const command = new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey });
  await s3Client.send(command);

  return { message: "Profile picture deleted successfully" };
}