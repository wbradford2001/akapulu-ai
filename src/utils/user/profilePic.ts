import { s3Client } from "../aws/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";


// Get profile pic for user according to ID
export async function getProfilePic(id: string): Promise<string> {
  const bucketName = process.env.BUCKET_URL as string;
  const region = process.env.AWS_REGION as string;
  const objectKey = `${id}/profile-picture.jpg`;

  // Return the public URL directly
  return `https://${bucketName}.s3.${region}.amazonaws.com/${objectKey}`;
}

// Upload a profile pic to S3
export async function postProfilePic(id: string, image: string, contentType: string) {
  const bucketName = process.env.BUCKET_URL as string;
  const objectKey = `${id}/profile-picture.jpg`;

  if (!image || !contentType) {
    throw new Error("Missing image or contentType");
  }

  // Create & Resize Image
  const buffer = Buffer.from(image, "base64");
  const resizedImageBuffer = await sharp(buffer)
    .resize({ width: 128, height: 128, fit: "inside" })
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

// Delete profile pic from S3 for user with id
export async function deleteProfilePic(id: string) {
  const bucketName = process.env.BUCKET_URL as string;
  const objectKey = `${id}/profile-picture.jpg`;

  const command = new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey });
  await s3Client.send(command);

  return { message: "Profile picture deleted successfully" };
}