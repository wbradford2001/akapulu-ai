import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma"; // Import Prisma client
import { getAuth } from "@clerk/nextjs/server";

import { fillInDefaults, defaultCustomParams, defaultModelParams,validateParams } from "../../../../utils/chatParamInvokation/chatParamInvokationDefaults";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { ConversationNode } from "@prisma/client";





// Creates a chatParamInvokation type with the specified parameters
export default async function createChatParamInvocationHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      preMadeChatParamId,
      modelParams= {},
      customParams= {},
      conversationNodes = []
    } = req.body;

  
    // If preMadeChatParamId is provided, fetch modelParams from the PreMadeChatParam
    let finalModelParams: Record<string, unknown>;
    let finalCustomParams: Record<string, unknown>;
    let finalConversationNodes: ConversationNode[] = []

    if (preMadeChatParamId) {
      const preMadeChatParam = await prisma.preMadeChatParam.findUnique({
        where: { id: preMadeChatParamId },
        select: { modelParams: true, customParams: true, conversationNodes: true}, // Ensure at least one other field is selected
      });

      if (!preMadeChatParam || !preMadeChatParam.modelParams || typeof preMadeChatParam.modelParams !== 'object' || Array.isArray(preMadeChatParam.modelParams) ||
        !preMadeChatParam.customParams || typeof preMadeChatParam.customParams !== 'object' || Array.isArray(preMadeChatParam.customParams)) {
        return res.status(400).json({ error: "Invalid or missing modelParams in PreMadeChatParam" });
      }

      finalModelParams = preMadeChatParam.modelParams as Record<string, unknown>
      finalCustomParams = preMadeChatParam.customParams as Record<string, unknown>

      finalConversationNodes = preMadeChatParam.conversationNodes

    } else {
      // Merge passed parameters with defaults
      finalModelParams = fillInDefaults(modelParams, defaultModelParams)
      finalCustomParams = fillInDefaults(customParams, defaultCustomParams)
      finalConversationNodes = conversationNodes
    }
    if (!validateParams(finalModelParams, defaultModelParams) || 
      !validateParams(finalCustomParams, defaultCustomParams)){
        return res.status(400).json({ error: "Invalid Chat Params" });
        
    }
    // Create the ChatParamInvocation with the final parameters
    const chatParamInvocation = await prisma.chatParamInvocation.create({
      data: {
        userId,
        preMadeChatParamId: preMadeChatParamId || null,
        modelParams: finalModelParams as InputJsonValue,
        customParams: finalCustomParams as InputJsonValue,
        conversationNodes: {
          create: finalConversationNodes.map((node: ConversationNode) => ({
            conversationNodeId: node.id
          }))
        }
      },
      include: {
        conversationNodes: true
      }
    });
    res.status(201).json(chatParamInvocation);
  } catch (error) {
    console.error("Error creating ChatParamInvocation:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}