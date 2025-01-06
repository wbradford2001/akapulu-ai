import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getProfilePic } from "../../../utils/profilePic"; // Import the utility function

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid user ID" });
  }

  try {
    // Fetch the username from the database
    const user = await prisma.user.findUnique({
      where: { id },
      select: { username: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let profilePictureUrl: string | null = null;

    try {
      // Get the profile picture URL from S3
      profilePictureUrl = await getProfilePic(id);
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      profilePictureUrl = null; // Fallback if profile picture is not found
    }

    return res.status(200).json({
      username: user.username,
      profilePicture: profilePictureUrl,
    });
  } catch (error) {
    console.error("Error handling user request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}