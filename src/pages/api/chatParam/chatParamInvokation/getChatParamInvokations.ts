import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { getAuth } from "@clerk/nextjs/server";


export default async function getChatParamInvokationsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(400).json({ error: "Missing userId in the request body" });
    }

    const chatParamInvokations = await prisma.chatParamInvocation.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        preMadeChatParamId: true,
        modelParams: true, 
        customParams: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" }, // Optional: order by creation date
    });

    res.status(200).json(chatParamInvokations);
  } catch (error) {
    console.error("Error fetching ChatParamInvokations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}