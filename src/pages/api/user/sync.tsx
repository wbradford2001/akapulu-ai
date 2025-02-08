import { Webhook } from "svix";
import { NextApiRequest, NextApiResponse } from "next";
import { WebhookEvent } from "@clerk/nextjs/server";
import { postProfilePic, deleteProfilePic, getProfilePic } from "../../../utils/user/profilePic"; // Import utilities

import { prisma } from "../../../lib/prisma"; // Import shared Prisma client

const SIGNING_SECRET = process.env.SIGNING_SECRET as string;

if (!SIGNING_SECRET) {
  throw new Error("Error: Please add SIGNING_SECRET to .env.local");
}

// Function to synchronize user on our end when changes are made in Clerk
export default async function syncHandler(req: NextApiRequest, res: NextApiResponse) {

  // Check request method is valid
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Initialize web hook class
  const wh = new Webhook(SIGNING_SECRET);

  // Parse Payload
  const payload = JSON.stringify(req.body);
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  //Ensure headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing Svix headers" });
  }

  // Verify webhook came from Clerk
  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.log(err)
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  // If user created
  if (evt.type === "user.created") {
    // Get user details
    const user = evt.data;
    const { id, email_addresses, first_name, last_name } = user;
    const email = email_addresses[0]?.email_address || "";

    const userExists = await prisma.user.findUnique({ where: { id } });

    // Create user
    if (!userExists) {
      await prisma.user.create({
        data: {
          id,
          email,
          firstName: first_name || email.split('@')[0], 
          lastName: last_name || "User"
        },
      });
    }

  
  // Upload profile pic
  if (user.has_image && user.image_url) {
    try {
      // Fetch the profile picture from Google
      const response = await fetch(user.image_url);
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      // Upload the profile picture using `postProfilePic`
      await postProfilePic(id, imageBuffer.toString("base64"), "image/jpeg");

      // Get the public profile picture URL using `getProfilePic`
      const profilePicUrl = await getProfilePic(id);

      // Update the user record in the database with the public profile picture URL
      await prisma.user.update({
        where: { id },
        data: { profilePicUrl },
      });
    } catch (error) {
      console.error(`Failed to fetch or upload profile picture for user ${id}:`, error);
    }
  }

  // If user deleted
  } else if (evt.type === "user.deleted") {

    // Parse user data
    const user = evt.data;
    const { id } = user;
    if (!id || typeof id !== "string") {
      console.error("Invalid user ID for deletion:", id);
      return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
      // Delete the profile picture using `deleteProfilePic`
      await deleteProfilePic(id);
    } catch (error) {
      console.error(`Failed to delete profile picture for user ${id}:`, error);
    }

    await prisma.user.delete({ where: { id } });
  }

  return res.status(200).json({ success: true });
}