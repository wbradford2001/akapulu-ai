import type { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "../../../../lib/prisma"; 
import { getAuth } from "@clerk/nextjs/server";


export default async function getChatParamInvokationHandler(
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

    const chatParamInvocation = await prisma.chatParamInvocation.findUnique({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        preMadeChatParamId: true,
        modelParams: true,
        customParams: true,
        createdAt: true,
        updatedAt: true,
        transcript: {
          orderBy: {
            order: "asc"
          }
        },
        conversationNodes: {        
          include: {
            conversationNode: true
          }
        }
      },
    });

    if (!chatParamInvocation) {
      return res.status(404).json({ error: "ChatParamInvocation not found" });
    }

    res.status(200).json(chatParamInvocation);
  } catch (error) {
    console.error("Error fetching ChatParamInvocation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}