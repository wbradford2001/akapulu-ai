import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "../../../../lib/prisma"; 
import { getAuth } from "@clerk/nextjs/server";


export default async function getPreMadeChatParamHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid or missing id" });
    }

    const preMadeChatParam = await prisma.preMadeChatParam.findUnique({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        userId: true,
        modelParams: true,
        customParams: true,
        createdAt: true,
        updatedAt: true,
        conversationNodes:  true
      },
    });

    if (!preMadeChatParam) {
      return res.status(404).json({ error: "PreMadeChatParam not found" });
    }

    res.status(200).json(preMadeChatParam);
  } catch (error) {
    console.error("Error fetching PreMadeChatParam:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}