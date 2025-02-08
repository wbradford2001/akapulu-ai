import { prisma } from "../../../lib/prisma";

import { ChatParamInvocation, ConversationNode } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

import { invokeModel } from "../../../utils/aws/bedRock";
import { findNextNode } from "../../../utils/chat/findNextNode";
import { CustomError } from "../../../utils/chat/customError";

import {customLog} from "../../../utils/testing/logger"



const CUSTOM_THROTTLE = 3000

interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

interface CustomParams {
  maxTime: number;
  maxTokens: number;
  // Add other fields if needed
  [key: string]: unknown; // Optional: To allow additional properties
}

export const endingString = `
This is the last message in the conversation, so tell them you have to go in a way that is consistent with the conversation so far.`

export const doNotReturnAnything = `
Do not return anything other than the words you are going to say - no sounds or actions or anything like that.
`

// modifies system prompt according to chatParamInvocations
function modifySystem(
  isEnd: boolean,
  chatParamInvokation: ChatParamInvocation,
  node: ConversationNode
): string {

  // extract data and validate input
  const modelParams: Record<string,unknown> = chatParamInvokation.modelParams as Record<string,unknown>
  if (!modelParams){
      throw new CustomError(400, `no model params`)
    }
  const customParams: Record<string,unknown> = chatParamInvokation.customParams as Record<string,unknown>
  const conversationType = customParams.conversationType
  const attitude = customParams.attitude
  const currentSystemPrompt = modelParams.system as string
  if (!currentSystemPrompt){
    throw new CustomError(400, `no system prompt`)
  }

  // generate new system prompt
  let newSystemPrompt: string = currentSystemPrompt + `.\n`;
  if (node.expectedSpeech){
    newSystemPrompt = currentSystemPrompt + `Please respond to the user based on the following idea: 

    (${node.expectedSpeech}), 

    and in a way that is consistent with the conversaion.

`
  }

  if (conversationType){
    newSystemPrompt = newSystemPrompt + `The conversation is of type: ${conversationType}.
`
  }

  if (attitude){
    newSystemPrompt = newSystemPrompt + `Your attitude should be: ${attitude}.
`
  }
  newSystemPrompt = newSystemPrompt + doNotReturnAnything
  if (isEnd){
    newSystemPrompt = newSystemPrompt += endingString;
  }
  return newSystemPrompt
}

// actual speech generation
async function generateSpeech(
  // speech generation
  chatParamInvocation: ChatParamInvocation,
  chatHistory: ChatHistory[],
  
  // utils
  now: Date,
  convoStartTime: Date,
  
  // IO (cumulative)
  claudeInputTokensSoFar: number, 
  claudeOutputTokensSoFar: number, 
  openAIInputTokensSoFar: number,
  openAIOutputTokensSoFar: number,  
  
  // node traversal
  currentAINodeData: ConversationNode,  // the current AI node u want to generate speech for

): Promise<{
  // response
  assistantMessage: string;

  // utils
  isConvoEnded: boolean;
  systemUsed: string;

  // IO
  claudeInputTokensUsed: number;
  claudeOutputTokensUsed: number;
  
}> {

  // check if we gotta end conversaton
  let isConvoEnded = false
  const timeSinceStart = Math.abs(now.getTime() - convoStartTime.getTime())
  const customParams = chatParamInvocation.customParams as CustomParams

  // validate maxTime & maxTokens
  if (!customParams){
    throw new CustomError(400, `there are no custom params for ${currentAINodeData}`)
  }
  const maxTime = customParams.maxTime
  if (! maxTime){
    throw new CustomError(400, `no maxTime found!`)
  }
  const maxTokens = customParams.maxTokens
  if (!maxTokens){
    throw new CustomError(400, `no maxTokens found!`)
  }

  // NOTE: same logic, but useful to log to console when conversation is over
  if (currentAINodeData.isEnd){
    isConvoEnded = true
  } else if ( 
    timeSinceStart >= maxTime ||
    claudeInputTokensSoFar + claudeOutputTokensSoFar + openAIInputTokensSoFar + openAIOutputTokensSoFar > maxTokens
  ) {
    console.log(`Convo went over: timesincestart: ${timeSinceStart}, maxTime: ${maxTime}
      maxTokens: ${maxTokens} total tokens: ${claudeInputTokensSoFar + claudeOutputTokensSoFar + openAIInputTokensSoFar + openAIOutputTokensSoFar}
      `)
    isConvoEnded = true
  }  

  // if aiWordForWord
  let assistantMessage:string = ""
  let systemUsed: string = ""
  let claudeInputTokensUsed: number = 0
  let claudeOutputTokensUsed: number = 0
  if (currentAINodeData.aiWordForWord){
    if (!currentAINodeData.expectedSpeech){
      throw new CustomError(400, `aiWordForWord is true but no expectedSpeech for ${currentAINodeData}`)
    }
    assistantMessage = currentAINodeData.expectedSpeech
    systemUsed = "no system - expectedSpeech"

  // generate custom speech
  } else {
    if (!currentAINodeData.expectedSpeech){
      console.warn(`node ${currentAINodeData.name} has no expectd speech but we're calling api`)
    }
    
    // generate custom system prompt
    const system =modifySystem(isConvoEnded, chatParamInvocation, currentAINodeData)
    systemUsed = system
    const aiResponse = await invokeModel(
      { messages: chatHistory, system },
    );
    claudeInputTokensUsed = aiResponse.usage.input_tokens;
    
    claudeOutputTokensUsed = aiResponse.usage.output_tokens; 
    
    assistantMessage = aiResponse.content[0].text;
  }


  if (assistantMessage == "" || systemUsed == ""){
    throw new CustomError(500, `Assistant message or system is empty string, message: ${systemUsed} system: ${systemUsed}`)
  }

  customLog(`\tAI said: ${assistantMessage}`, 1)
  return {
    claudeInputTokensUsed, 
    claudeOutputTokensUsed,
    assistantMessage,
    isConvoEnded, 
    systemUsed
  }
}


interface TraverseRequest {
  // speech generation
  currentAINode: string;  // Current AI node
  chatHistory: ChatHistory[];
  chatParamInvocation: ChatParamInvocation;

  // utils
  convoStartTime: Date;
  prevTimeStamp: Date;
  nodeNumber: number; // used to assign an order to transcript rows

  stack: string[];  // Stack of option nodes
  scriptJson: Record<string, ConversationNode>;

  // IO - NOTE: We are passed in cumulative amount to check if we've gone over
  claudeInputTokensSoFar: number;
  claudeOutputTokensSoFar: number;
  openAIInputTokensSoFar: number,
  openAIOutputTokensSoFar: number,  
}

interface TraverseResponse {

  // speech
  nextUserNode: string | null;  // the next user node
  message: string; // ai message
  
  // utils
  systemUsed: string; // system prompt fed to the ai node
  updatedScriptJson: Record<string, ConversationNode>; // the update sctipt
  updatedStack: string[]; // stack to keep track of options nodes
  
  // IO
  updatedClaudeInputTokensSoFar: number; 
  updatedClaudeOutputTokensSoFar: number; 
  
  // node traversal
  isEnd: boolean; // used for ending convo early cuz of time

  // error
  errorMessage?: string | null;
}

export default async function traverseHandler(
    req: NextApiRequest,
    res: NextApiResponse<TraverseResponse>
) {  
  try {
    if (req.method !== "PUT") {
      throw new CustomError(405, `Invalid request method, supposed to be PUT, recieved ${req.method}`)
    }

    
    // we edit these
    let {
      currentAINode,
      stack,
      scriptJson,
    } = req.body as TraverseRequest
    const {
      // convo stuff
      chatHistory,
      chatParamInvocation,
      
      // utils
      convoStartTime,
      prevTimeStamp,
      nodeNumber,
    
      
      // IO
      claudeInputTokensSoFar, 
      claudeOutputTokensSoFar,
      openAIInputTokensSoFar,
      openAIOutputTokensSoFar,
    } = req.body as TraverseRequest

    // validate input
    if (!currentAINode || currentAINode == null || currentAINode == undefined){
      throw new CustomError(400, "currentAINode is undefined")
    }
    if (!scriptJson || scriptJson == undefined){
      throw new CustomError(400, "scriptJson is undefined")
    }
    if (!scriptJson[currentAINode] || scriptJson[currentAINode] == undefined || scriptJson[currentAINode] == null){
      throw new CustomError(400, `node ${currentAINode} not in scriptJson: ${scriptJson}`)
    }
    // get currentAINode
    let currentAINodeData: ConversationNode = scriptJson[currentAINode];

    if (currentAINodeData.role != "AI"){
      throw new CustomError(400, `currentAINode ${currentAINode} is not an AI node`)
    }    

    customLog(`\t\tEntering Traverse Handler with currentUserNode: ${currentAINode}`, 2)
    
    // throttle requests
    const now: Date = new Date()
    if (prevTimeStamp && Math.abs(now.getTime() - prevTimeStamp.getTime()) <= CUSTOM_THROTTLE){
      await new Promise((resolve) => setTimeout(resolve, CUSTOM_THROTTLE));
    }

    // if we recieve an options node - pick the next option
    if (currentAINodeData.nodeType === "options"){
      const {nextNode, updatedScriptJson, updatedStack} = findNextNode(currentAINode, scriptJson, stack)
      if (!nextNode){
        throw new CustomError(400, `next node is null !`)
      }
      currentAINode = nextNode
      scriptJson = updatedScriptJson
      stack = updatedStack
      currentAINodeData = scriptJson[nextNode]
    }


      const {
        claudeInputTokensUsed,
        claudeOutputTokensUsed,
        assistantMessage,
        isConvoEnded,
        systemUsed
      } = await generateSpeech(
          // speech generation
          chatParamInvocation,
          chatHistory,
          
          // utils
          now,
          convoStartTime,
        
          // IO (cumulative)
          claudeInputTokensSoFar, 
          claudeOutputTokensSoFar, 
          openAIInputTokensSoFar,
          openAIOutputTokensSoFar,  
          
          // node traversal
          currentAINodeData,  // the current AI node u want to generate speech for

      )

      // validate response
      if (!assistantMessage){
        throw new CustomError(500, `no assistant message!`)
      }
      if (!systemUsed){
        throw new CustomError(500, `no system used!`)
      }

      const updatedClaudeInputTokensSoFar = claudeInputTokensSoFar + claudeInputTokensUsed
      const updatedClaudeOutputTokensSoFar = claudeOutputTokensSoFar + claudeOutputTokensUsed


      // Update the transcript with the AI's response
      await prisma.$executeRawUnsafe(
        `INSERT INTO "TranscriptRow" (id, role, content, "chatParamInvocationId", "convoNodeId", "order", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1::"Role", $2, $3, $4, $5, now(), now())`,
        "AI",
        assistantMessage,
        chatParamInvocation.id,
        currentAINodeData?.id || null, // Ensure convoNodeId is either valid or null
        nodeNumber
      );
      // Find the next user node
      const {nextNode: nextUserNode, updatedScriptJson, updatedStack} = findNextNode(currentAINode, scriptJson, stack);
      
      // validate nextnode
      if (!nextUserNode && currentAINodeData.isEnd == false){
        throw new Error(`no next node, but ${currentAINode} has isEnd == false`)
      }
      // next next user node.role == user
      if (nextUserNode){
        const nextUserNodeData = updatedScriptJson[nextUserNode]
        if (nextUserNodeData.role !== "user"){
          throw new CustomError(500, `next node ${nextUserNode} has role ${nextUserNodeData.role}`)
        }
      }


      // Return the AI's response and the next user node
      return res.status(200).json({
        // speech
        nextUserNode: nextUserNode, // the next user node
        message: assistantMessage, // ai message
        
        // utils
        systemUsed: systemUsed,// system prompt fed to the ai node
        updatedScriptJson: updatedScriptJson, // the update sctipt
        updatedStack: updatedStack, // stack to keep track of options nodes
        
        // IO
        updatedClaudeInputTokensSoFar: updatedClaudeInputTokensSoFar, 
        updatedClaudeOutputTokensSoFar: updatedClaudeOutputTokensSoFar, 
        
        // node traversal
        isEnd: isConvoEnded,
      });

  } catch (error) {
    if (error instanceof CustomError) {
      console.error("Error in traverse handler speech:", error.customMessage);
      return res.status(error.statusCode).json({
        nextUserNode: null,
        message: "", 
        systemUsed: "",
        updatedScriptJson: {}, 
        updatedStack: [],
        updatedClaudeInputTokensSoFar: 0, 
        updatedClaudeOutputTokensSoFar: 0, 
        isEnd: true,
        errorMessage: error.customMessage
      });
    }

    console.log("Internal server error:")
    console.log(error)
    return res.status(500).json({
      nextUserNode: null,
      message: "", 
      systemUsed: "",
      updatedScriptJson: {}, 
      updatedStack: [],
      updatedClaudeInputTokensSoFar: 0, 
      updatedClaudeOutputTokensSoFar: 0, 
      isEnd: true,
      errorMessage: "internal server error"
    });  
  }
}

