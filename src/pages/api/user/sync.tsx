import { Webhook } from "svix";
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { WebhookEvent } from "@clerk/nextjs/server"; // Import type

const prisma = new PrismaClient();

const SIGNING_SECRET = process.env.SIGNING_SECRET as string;

if (!SIGNING_SECRET) {
  throw new Error("Error: Please add SIGNING_SECRET to .env.local");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Received request:", {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  if (req.method !== "POST") {
    console.log("Invalid method:", req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const wh = new Webhook(SIGNING_SECRET);

  const payload = JSON.stringify(req.body);
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.log("Missing Svix headers:", {
      svix_id,
      svix_timestamp,
      svix_signature,
    });
    return res.status(400).json({ error: "Missing Svix headers" });
  }

  let evt: WebhookEvent;

  try {
    console.log("Verifying webhook...");
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("Webhook verified successfully:", evt);
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  console.log("Handling event type:", evt.type);

  // Handle different event types
  if (evt.type === "user.created") {
    const user = evt.data;
    const { id, email_addresses, first_name, last_name } = user;
  
    const email = email_addresses[0]?.email_address || "";
    const username = email.split("@")[0]; // Default username
  
    const userExists = await prisma.user.findUnique({ where: { id } });
  
    if (!userExists) {
      await prisma.user.create({
        data: {
          id,
          firstName: first_name || "",
          lastName: last_name || "",
          email,
          username, 
          credits: 0,
        },
      });
    }
  }
   else if (evt.type === "user.deleted") {
    const user = evt.data;
    const { id } = user;

    console.log("Processing user.deleted event for user:", { id });

    await prisma.user.delete({ where: { id } });
    console.log("User deleted successfully:", { id });
  } else {
    console.log("Unhandled event type:", evt.type);
  }

  return res.status(200).json({ success: true });
}
