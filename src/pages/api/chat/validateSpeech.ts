import { prisma } from "../../../lib/prisma";
import { ChatParamInvocation, ConversationNode } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";


import { CustomError } from "../../../utils/chat/customError";

import { validateWithOpenAI, validateMultipleWithOpenAI } from "../../../utils/openAI/openAI";
import { findNextNode } from "../../../utils/chat/findNextNode";

import {customLog} from "../../../utils/testing/logger"

const CUSTOM_THROTTLE = 1000;

interface ValidateSpeechRequest {

  // input stuff 
  userInput: string; // what the user actually says
  currentUserNode: string; // the current user node
  chatParamInvocation: ChatParamInvocation; // the chatParamInvocation user
  threshold: number;// threshold that has to matc from 0 -10, 0 means pretty much matches all, 10 means has to match exact

  // utils
  scriptJson: Record<string, ConversationNode>; // the script for all nodes
  stack: string[];


  // util stuff
  nodeNumber: number // used to attach an order to transcripts
  prevTimeStamp: Date; // timestamp of last request, used for throttling
}

interface ValidateSpeechResponse {
  // validation
  match: boolean;          // Did user input match expected speech
  score: number;         // Match quality score (1-10)
  explanation: string;   // OpenAI's explanation of match

  // io stuff
  openAIInputTokensUsed: number;   // OpenAI API input token count
  openAIOutputTokensUsed: number;  // OpenAI API output token count

  // util stuff
  updatedScriptJson: Record<string, ConversationNode>; // Updated script state
  updatedStack: string[] // updated Stack

  // next nodes
  nextAINodePass?: string | null; // Next node to traverse to (ai node) if validation succeeds
  nextUserNodesIfOptions?: Record<string, string | null>; // for user option nodes, we can return a map with all the next user nodes that map to their next AI nodes, so if the user over writes our failure, we know the next node
  nextAINodeFail: string | null; // Next node to traverse to (ai node) if validation fails

  // optional error message
  errorMessage?: string | null;

}

export default async function validateSpeechHandler(
  req: NextApiRequest,
  res: NextApiResponse<ValidateSpeechResponse>,
) {
  try {
    const {
      userInput,
      currentUserNode,
      scriptJson,
      chatParamInvocation,
      prevTimeStamp,
      stack,
      nodeNumber
    } = req.body as ValidateSpeechRequest;


    if (req.method !== "POST") {
      throw new CustomError(405, `Invalid request method, supposed to be POST, recieved ${req.method}`)
    }

    if (currentUserNode == undefined){
      throw new CustomError(400, `currentUserNode is undefined`)
    }

  
    // parse data (current user node)
    const currentUserNodeData: ConversationNode = scriptJson[currentUserNode];
  

    // if it's a hidden transcript node, pass
    if (currentUserNode === "initial_user_node" && currentUserNodeData.ignoreInTranscript){
      
      // find next node
      const {nextNode, updatedScriptJson, updatedStack} = findNextNode(currentUserNode, scriptJson, stack)

      return res.status(200).json({
        match: true,
        score: 10,
        explanation: "initial user node",
        openAIInputTokensUsed: 0,
        openAIOutputTokensUsed: 0,
        updatedScriptJson: updatedScriptJson,
        updatedStack: updatedStack,
        nextAINodePass: nextNode,
        nextAINodeFail: null,
      });
    }

      customLog(`\t\tEntering validateSpeech with currentUserNode: ${currentUserNode}`, 2)

    
    // custom throttle
    const now: Date = new Date();
    if (
      prevTimeStamp &&
      Math.abs(now.getTime() - prevTimeStamp.getTime()) <= CUSTOM_THROTTLE
    ) {
      await new Promise((resolve) => setTimeout(resolve, CUSTOM_THROTTLE));
    }

    // add to transcript
    if (!currentUserNodeData.ignoreInTranscript) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "TranscriptRow" (id, role, content, "chatParamInvocationId", "convoNodeId", "order", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1::"Role", $2, $3, $4, $5, now(), now())`,
        "user",
        userInput,
        chatParamInvocation.id,
        currentUserNodeData?.id || null, // Ensure convoNodeId is either valid or null
        nodeNumber
      );
    }
    
    // extract data
    const expectedSpeech = currentUserNodeData.expectedSpeech;
    const verifySpeech = currentUserNodeData.verifySpeech;
  
    // If no verify, return
    if (!verifySpeech && currentUserNodeData.nodeType === "regular") {   
      // find next node
      const {nextNode, updatedScriptJson, updatedStack} = findNextNode(currentUserNode, scriptJson, stack)

      return res.status(200).json({
        match: true,
        score: 10,
        explanation: "no validation required",
        openAIInputTokensUsed: 0,
        openAIOutputTokensUsed: 0,
        updatedScriptJson: updatedScriptJson,
        updatedStack: updatedStack,
        nextAINodePass: nextNode,
        nextAINodeFail: null,
      });
    }

    // VALIDATE SINGLE (NO OPTIONS) NODE
    if (currentUserNodeData.options.length == 0 || currentUserNodeData.nodeType !== "options") {
      // validate input
      if (!(currentUserNodeData.options.length == 0 && currentUserNodeData.nodeType !== "options")){
        throw new CustomError(400, `Node ${currentUserNode} with node type ${currentUserNodeData.nodeType} but options length ${currentUserNodeData.options.length}`)
      }
      if (!expectedSpeech || !userInput) {        
        throw new CustomError(400, `Node ${currentUserNode} with expectedSpeech ${expectedSpeech} and userInput ${userInput}`)
      }

      const threshold = currentUserNodeData.threshold

      // validate single node
      const {
        // validation 
        match,
        score,
        explanation,

        // IO
        inputTokensUsed,
        outputTokensUsed
      } = await validateWithOpenAI(expectedSpeech, userInput, threshold);
      customLog(`\t\t\tvalidation for ${currentUserNode}, match: ${match}, score: ${score}, explanation: ${explanation}`, 1)

      const {nextNode, updatedScriptJson, updatedStack} = findNextNode(currentUserNode, scriptJson, stack)
      const nextAINodeFail = currentUserNodeData.fallbackNodeName
      return res.status(200).json({
        match: match,
        score: score,
        explanation: explanation,
        openAIInputTokensUsed: inputTokensUsed,
        openAIOutputTokensUsed: outputTokensUsed,
        updatedScriptJson: updatedScriptJson,
        updatedStack: updatedStack,
        nextAINodePass: nextNode,
        nextAINodeFail: nextAINodeFail,
      });


    // if options node
    } else {
      // validate input
      if (expectedSpeech || currentUserNodeData.nodeType !== "options") {
        throw new CustomError(400, `node ${currentUserNode} has expectedSpeech & node type ${currentUserNodeData.role}`)
      }

      const { 
        // validation 
        match, // whether or not we found a match
        score, // how confident we are in out choice
        explanation, // explanation of our choice
        nextUserNode, // the chosen AI node (if match), will be null if no match

        // IO
        inputTokensUsed, 
        outputTokensUsed
      } = await validateMultipleWithOpenAI(currentUserNode, scriptJson, userInput);

      // update next AI node if the validation returned a viable option
      let nextAINodePass: string | null = null
      let updatedScriptJson = scriptJson
      let updatedStack = stack
      if (nextUserNode){
        const nextNodeResult = findNextNode(nextUserNode, scriptJson, stack)
        nextAINodePass = nextNodeResult.nextNode
        updatedScriptJson = nextNodeResult.updatedScriptJson
        updatedStack = nextNodeResult.updatedStack
      }
      // find the next node
      const nextAINodeFail = currentUserNodeData.fallbackNodeName

      // populate map of next user nodes to next AI nodes in case user over rides and picks user node
      const nextUserNodesIfOptions: Record<string, string | null> = {}
      for (const node of currentUserNodeData.options){
         const {nextNode}= findNextNode(node, scriptJson, stack)
         nextUserNodesIfOptions[node] = nextNode
      }

      // we decrement traverse number of options for user node (even tho we do this in findNextNode, we only call findOption for AI option nodes)
      return res.status(200).json({
        match: match,
        score: score,
        explanation: explanation,
        openAIInputTokensUsed: inputTokensUsed,
        openAIOutputTokensUsed: outputTokensUsed,
        updatedScriptJson: updatedScriptJson,
        updatedStack: updatedStack,
        nextAINodePass: nextAINodePass,
        nextUserNodesIfOptions: nextUserNodesIfOptions,
        nextAINodeFail: nextAINodeFail,
      });
    
    }
  } catch (error) {
    
    if (error instanceof CustomError) {
      console.error("Error validating speech:", error.customMessage);
      return res.status(error.statusCode).json({
        match: false,
        score: 0,
        explanation: "",
        openAIInputTokensUsed: 0,
        openAIOutputTokensUsed: 0,
        updatedScriptJson: {},
        updatedStack: [],
        nextAINodePass: null,
        nextAINodeFail: null,
        errorMessage: error.customMessage
      });
    }
  
    // Default to internal server error for other exceptions
    return res.status(500).json({
      match: false,
      score: 0,
      explanation: "",
      openAIInputTokensUsed: 0,
      openAIOutputTokensUsed: 0,
      updatedScriptJson: {},
      updatedStack: [],
      nextAINodePass: null,
      nextAINodeFail: null,
      errorMessage: "internal server error"
    });
  }

}