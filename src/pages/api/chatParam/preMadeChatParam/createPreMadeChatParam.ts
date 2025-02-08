import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma"; // Import Prisma client
import { ConversationNode, Prisma } from "@prisma/client"; // Import Prisma types
import { getAuth } from "@clerk/nextjs/server";

import { defaultCustomParams, defaultModelParams, validateParams } from "../../../../utils/chatParamInvokation/chatParamInvokationDefaults";
import { fillInDefaults } from "../../../../utils/chatParamInvokation/chatParamInvokationDefaults";


// Creates a chatParamInvokation type with the specified parameters
export default async function createPreMadeChatParamHandler(
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
      name,
      modelParams,
      customParams,
      conversationNodes = []
    } = req.body;
    
    // Merge passed parameters with defaults
    const finalModelParams = fillInDefaults(modelParams,defaultModelParams)


    // Merge passed parameters with defaults
    const finalCustomParams = fillInDefaults(customParams,defaultCustomParams)

    if (!validateParams(finalModelParams, defaultModelParams) || 
      !validateParams(finalCustomParams, defaultCustomParams)){
        return res.status(400).json({ error: "Invalid Chat Params" });
    }

    // remove preMadeChatParamId from conversationNodes
    const updatedConversationNodes =conversationNodes.map((node: ConversationNode)=>{
      const {preMadeChatParamId, ...rest} = node

      // avoid type error
      if (preMadeChatParamId){

      }
      return rest
    })

    // Create the ChatParamInvocation with the final parameters
    const preMadeChatParam = await prisma.preMadeChatParam.create({
      data: {
        userId,
        name,
        modelParams: finalModelParams as Prisma.InputJsonValue, // Store modelParams as JSON
        customParams: finalCustomParams as Prisma.InputJsonValue,
        conversationNodes: {
          connect: updatedConversationNodes.map((node: ConversationNode) => ({
            id: node.id
          }))
        }
      },
    });
    res.status(201).json(preMadeChatParam);
  } catch (error) {
    console.error("Error creating preMadeChatParam:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}