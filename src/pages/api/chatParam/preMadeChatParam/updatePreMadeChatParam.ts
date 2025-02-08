import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma"; // Import Prisma client
import { Prisma } from "@prisma/client"; // Import Prisma types
import { getAuth } from "@clerk/nextjs/server";
import {ConversationNode} from "@prisma/client"
import { validateParams, defaultCustomParams, defaultModelParams } from "../../../../utils/chatParamInvokation/chatParamInvokationDefaults"
// Creates a chatParamInvokation type with the specified parameters
export default async function updatePreMadeChatParamHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "PUT") { // Change to PUT
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    const { id, 
      name, 
      modelParams, 
      customParams, 
      conversationNodes = [] 
    } = req.body;

    if (!id) { // Check for id
      return res.status(400).json({ error: "Missing required field: id" });
    }
  
    const existingPreMadeChatParam = await prisma.preMadeChatParam.findUnique({
      where: { id, userId },
      select: {name: true, userId: true, modelParams: true, customParams: true}
    });
  
    if (!existingPreMadeChatParam) { // Check if resource exists
      return res.status(404).json({ error: "PreMadeChatParam not found" });
    }
  
    if (existingPreMadeChatParam.userId !== userId) { // Ensure ownership
      return res.status(403).json({ error: "Forbidden: You cannot update this resource" });
    }
    
    const updatedModelParams = { ...existingPreMadeChatParam.modelParams as object} as Record<string, unknown>;

    for (const key in modelParams) {
      if (modelParams[key] !== undefined) {
        updatedModelParams[key] = modelParams[key];
      }
    }
    const updatedCustomParams = { ...existingPreMadeChatParam.customParams as object} as Record<string, unknown>;
    
    for (const key in customParams) {
      if (customParams[key] !== undefined) {
        updatedCustomParams[key] = customParams[key];
      }
    }

      if (!validateParams(updatedModelParams, defaultModelParams) || 
      !validateParams(updatedCustomParams, defaultCustomParams)){
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

    const updatedPreMadeChatParam = await prisma.preMadeChatParam.update({
      where: { id }, // Update by id
      data: {
        name: name || existingPreMadeChatParam.name, // Update name if provided
        modelParams: updatedModelParams as Prisma.InputJsonValue, 
        customParams: updatedCustomParams as Prisma.InputJsonValue, 
        conversationNodes: {
          set: [],
          create:
            updatedConversationNodes
        }
      },
    });
  
    res.status(200).json(updatedPreMadeChatParam); // Change status code to 200
  } catch (error) {
    console.error("Error updating preMadeChatParam:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}