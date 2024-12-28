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
    console.error("Error: Could not verify webhook:", err);
    return res.status(400).json({ error: "Webhook verification failed" });
  }

  // Handle different event types
  if (evt.type === "user.created") {
    const user = evt.data;
    const { id, email_addresses, first_name, last_name, username } = user;

    const userExists = await prisma.user.findUnique({ where: { id } });

    if (!userExists) {
      await prisma.user.create({
        data: {
          id,
          firstName: first_name || "",
          lastName: last_name || "",
          email: email_addresses[0]?.email_address || "",
          username: username || "",
          credits: 0,
        },
      });
    }

  } else if (evt.type === "user.deleted") {
    const user = evt.data;
    const { id } = user;

    await prisma.user.delete({ where: { id } });

  }

  return res.status(200).json({ success: true });
}
