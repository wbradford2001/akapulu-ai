import { Webhook } from "svix";
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { WebhookEvent } from "@clerk/nextjs/server";
import { postProfilePic, deleteProfilePic } from "../../../utils/profilePic"; // Import utilities

const prisma = new PrismaClient();

const SIGNING_SECRET = process.env.SIGNING_SECRET as string;

if (!SIGNING_SECRET) {
  throw new Error("Error: Please add SIGNING_SECRET to .env.local");
}

export default async function syncHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const wh = new Webhook(SIGNING_SECRET);

  const payload = JSON.stringify(req.body);
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing Svix headers" });
  }

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

  if (evt.type === "user.created") {
    const user = evt.data;
    const { id, email_addresses } = user;

    const email = email_addresses[0]?.email_address || "";
    const username = email.split("@")[0];

    const userExists = await prisma.user.findUnique({ where: { id } });

    if (!userExists) {
      await prisma.user.create({
        data: {
          id,
          email,
          username,
          credits: 0,
        },
      });
    }

    const googleProfilePictureUrl = user.image_url || null;

    if (googleProfilePictureUrl) {
      try {
        // Fetch the profile picture from Google
        const response = await fetch(googleProfilePictureUrl);
        const imageBuffer = Buffer.from(await response.arrayBuffer());

        // Upload the profile picture using `postProfilePic`
        await postProfilePic(id, imageBuffer.toString("base64"), "image/jpeg");
        console.log(`Profile picture uploaded for user ${id}`);
      } catch (error) {
        console.error(`Failed to fetch or upload profile picture for user ${id}:`, error);
      }
    }
  } else if (evt.type === "user.deleted") {
    const user = evt.data;
    const { id } = user;
    if (!id || typeof id !== "string") {
      console.error("Invalid user ID for deletion:", id);
      return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
      // Delete the profile picture using `deleteProfilePic`
      await deleteProfilePic(id);
      console.log(`Profile picture deleted for user ${id}`);
    } catch (error) {
      console.error(`Failed to delete profile picture for user ${id}:`, error);
    }

    await prisma.user.delete({ where: { id } });
    console.log(`User ${id} deleted successfully`);
  }

  return res.status(200).json({ success: true });
}