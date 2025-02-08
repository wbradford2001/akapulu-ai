import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "../../../lib/prisma"; // Import shared Prisma client


// Function to return username and user profile picture for given user id
export default async function getUserDetails(req: NextApiRequest, res: NextApiResponse) {

  // Get id of user
  const { id } = req.body;

  // Ensure proper method used
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Ensure id in valid format
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid user ID" });
  }

  try {
    // Fetch the username from the database
    const user = await prisma.user.findUnique({
      where: { id },
      select: { 
        firstName: true,
        lastName: true,
        email: true,
        profilePicUrl: true
       },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePicUrl: user.profilePicUrl,
    });
  } catch (error) {
    console.error("Error handling user request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}