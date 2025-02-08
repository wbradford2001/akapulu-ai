import traverseHandler from "../../pages/api/chat/traverse";
import { createMocks } from "node-mocks-http";
import {
  ChatParamInvocation,
  ChatParamInvocationConversationNode,
  ConversationNode,
} from "@prisma/client";
import createPreMadeChatParamHandler from "../../pages/api/chatParam/preMadeChatParam/createPreMadeChatParam";
import getChatParamInvokationHandler from "../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation";
import createChatParamInvocationHandler from "../../pages/api/chatParam/chatParamInvokation/createChatParamInvokation";
import createConvoNodesHandler from "../../pages/api/convoNodes/createConvoNode";
import { ConversationNodeInput } from "../conversationNode/createConversationNode";
import validateSpeechHandler from "../../pages/api/chat/validateSpeech";
import {
  defaultCustomParams,
  defaultModelParams,
} from "../chatParamInvokation/chatParamInvokationDefaults";
import { addTestCosts } from "../../utils/testing/modelPricingInterface";

import {customLog} from "../../utils/testing/logger"

// INTERFACE FOR CHATPARAM INVOCATION
type CustomParams = {
  [K in keyof typeof defaultCustomParams]: (typeof defaultCustomParams)[K]["default"];
};

type ModelParams = {
  [K in keyof typeof defaultModelParams]: (typeof defaultModelParams)[K]["default"];
};

export type ChatParamInvocationWithNodes = ChatParamInvocation & {
  customParams: CustomParams;
  modelParams: ModelParams;
  conversationNodes: (ChatParamInvocationConversationNode & {
    conversationNode: ConversationNode;
  })[];
};

export interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

// CALLS TRAVERSE API AND VALIDATESPEECH API FOR A CONVERSATION
export async function runTraverseSession({
  chatParamInvocation,
  thingsToSay = [],
  overRideIndex = null,
  overRideOptionsToUserNode,// if we override an options node, we want to pick the next user node manually
  filename,
}: {
  chatParamInvocation: ChatParamInvocationWithNodes;
  thingsToSay?: string[];
  overRideIndex?: number | null;
  overRideOptionsToUserNode?: string; // if we override an options node, we want to manually provide the next ai node
  filename: string
}):
  Promise<{ visited: string[]; systemsUsed: string[] }>
 {
  const startTime = new Date()


  // Extract conversationNodes
  const conversationNodes: ConversationNode[] =
    chatParamInvocation.conversationNodes.map((node) => {
      return node.conversationNode;
    });

  // Create the name-to-node map
  let scriptJson = conversationNodes.reduce(
    (map, node) => {
      map[node.name] = node;
      return map;
    },
    {} as Record<string, ConversationNode>,
  );

  // Find the start node
  const startNode = conversationNodes.find((node) => node.isStart)?.name;
  if (!startNode) {
    throw new Error("No start node found in the conversation nodes.");
  }

  //currenUsertNode: the current user node
  let currentUserNode: string = startNode; 

  // list of node names visited, used for validation
  const visited: string[] = [];

  // used to end convo if over maxTokens/maxTime
  let claudeInputTokensSoFar = 0;
  let claudeOutputTokensSoFar = 0;

  let openAIInputTokensSoFar = 0;
  let openAIOutputTokensSoFar = 0;

  const convoStartTime: Date = new Date();
  let prevTimeStamp = null; // used to compare time since last request to throttle

  // Initialize chat history
  const chatHistory: ChatHistory[] = [];

  // array of system prompts used, for validation
  const systemsUsed: string[] = [];

  // stack for option traversal
  let stack: string[] = []

  // for keeping track of which thing were going to say
  let thingsToSayIndex = 0;

  // to add order to transcripts
  let nodeNumber = 0;

  // currentNode starts out as a user node
  while (currentUserNode) {
    customLog(`Entering run Traverse Session with currentUserNode: ${currentUserNode}`, 2)
    
    // add the current node to visited
    visited.push(currentUserNode);

    // extract data from currentNode
    const currentUserNodeData = scriptJson[currentUserNode];

    if (currentUserNodeData.role != "user") {
      throw new Error("Expected User node");
    }

    // assign user input
    let userInput = "";
    // if no expected speech, that means we have options node
    if (!currentUserNodeData.expectedSpeech || 
      currentUserNodeData.nodeType === "options" ||
      currentUserNodeData.options.length > 0 
    ) {

      if (!thingsToSay || !thingsToSayIndex){
        throw new Error("No things to say / things to say index")
      }

      userInput = thingsToSay[thingsToSayIndex]
    } else {
      userInput =
        thingsToSay && thingsToSay[thingsToSayIndex]
          ? thingsToSay[thingsToSayIndex]
          : currentUserNodeData.expectedSpeech;
    }
    if (!userInput) {
      throw new Error("No userInput");
    }
    customLog(`\tUser input: ${userInput}`,1)

    // call validate speech
    const validateSpeechRequest = createMocks({
      method: "POST",
      body: {
        // input stuff
        userInput,
        currentUserNode,
        chatParamInvocation,

        // utils
        scriptJson,
        stack,
        nodeNumber,

        //util stuff
        prevTimeStamp,
      },
    });

    await validateSpeechHandler(validateSpeechRequest.req, validateSpeechRequest.res);
    const validateSpeechResponse = JSON.parse(validateSpeechRequest.res._getData());

    // validate speech returns the tokens used, so use that to add to tokens so far
    openAIInputTokensSoFar += validateSpeechResponse.openAIInputTokensUsed;
    openAIOutputTokensSoFar += validateSpeechResponse.openAIOutputTokensUsed;

    // assign & scriptJson
    stack = validateSpeechResponse.updatedStack
    scriptJson = validateSpeechResponse.updatedScriptJson

    // increment node number
    nodeNumber += 1

    // assign next node
    let currentAINode: string
    // if we've got a match
    if (validateSpeechResponse.match) {
      // push to stack if we've got an options node

      currentAINode = validateSpeechResponse.nextAINodePass 

    // if we dont have match but we override
    } else if (overRideIndex != null && overRideIndex === thingsToSayIndex) {

      // if we over ride regular (non option) node
      if (currentUserNodeData.nodeType !== "options"){
        currentAINode = validateSpeechResponse.nextAINodePass // currentNode is now an AI node

        // if we over ride an option node, we want to manually pick the next node 
      } else {
        if (!overRideOptionsToUserNode){
          throw new Error("no override to ai node but we over ride an options node")
        }
        currentAINode = validateSpeechResponse.nextUserNodesIfOptions[overRideOptionsToUserNode]
      }

      // verification failed
    } else {
      if (!currentUserNodeData.fallbackNodeName){
        throw new Error("No fall back node and verificaiton failed!")
      }
      currentAINode = currentUserNodeData.fallbackNodeName;
    }

    // check if we have to end
    if (!currentAINode){
      console.log("currentAINode is null")
      return {
        visited,
        systemsUsed
      }
    }
    // check that we have a valid AI node
    const currentAINodeData = scriptJson[currentAINode];
    if (currentAINodeData.role !== "AI"){
      throw new Error("Expected an AI node!")
    }

    // add the AI node to visited
    visited.push(currentAINode);

    // increment thingsToSayIndex & assign currentNode & update scriptJson
    thingsToSayIndex += 1;

    // Only add validated/overridden input to chat history
    chatHistory.push({ role: "user", content: userInput });

    // used for throttling since last request
    const now: Date = new Date();
    // call traverse handler
    const { req, res } = createMocks({
      method: "PUT",
      body: {

        // speech generation
        currentAINode,  // Current AI node
        chatHistory,
        chatParamInvocation,

        // utils
        convoStartTime,
        prevTimeStamp,
        nodeNumber,

        stack,
        scriptJson,

        // IO - NOTE: We are passed in cumulative amount to check if we've gone over
        claudeInputTokensSoFar,
        claudeOutputTokensSoFar,
        openAIInputTokensSoFar,
        openAIOutputTokensSoFar,
      },
    });
    await traverseHandler(req, res);

    // parse traverse handler ouput
    if (res._getStatusCode() != 200) {
      throw new Error("Error in traverseHandler");
    }

    const traverseResult = JSON.parse(res._getData());

    // add the system used to systemsUsed
    systemsUsed.push(traverseResult.systemUsed);
    

    // Update token counters (traverse returns the accumulated tokens)
    claudeInputTokensSoFar = traverseResult.updatedClaudeInputTokensSoFar
    claudeOutputTokensSoFar = traverseResult.updatedClaudeOutputTokensSoFar

    // update prevTimeStamp for customThrottling
    prevTimeStamp = now;

    // increment node number
    nodeNumber += 1

    // Update chat history with the assistant's response if applicable
    if (traverseResult.message) {
      chatHistory.push({ role: "assistant", content: traverseResult.message });
    }

    // update script and stack
    scriptJson = traverseResult.updatedScriptJson
    stack = traverseResult.updatedStack

    currentUserNode = traverseResult.nextUserNode

    // End the loop if the conversation ends
    if (traverseResult.isEnd) {
      break;
    }

    //validate variables for next iteration
    if (!scriptJson || stack == undefined || stack == null || 
      !currentAINode || !prevTimeStamp
    ){
      throw new Error(`Invalid variables for next iteration, 
            scriptJson: ${scriptJson},
            stack: ${stack},
            current ai node: ${currentAINode},
            prevTimeStamp: ${prevTimeStamp}
        `)
    }
  }

  // after while loop
  console.log("Token counts:", {
    claudeInput: claudeInputTokensSoFar,
    claudeOutput: claudeOutputTokensSoFar,
    openAIInput: openAIInputTokensSoFar,
    openAIOutput: openAIOutputTokensSoFar,
  });
  const now = new Date()
  const duration = now.getTime() - startTime.getTime()
  console.log(`duration: ${(duration/1000).toFixed(0)} seconds`)
  await addTestCosts(
    filename,
    duration, 
    claudeInputTokensSoFar,
    claudeOutputTokensSoFar,
    openAIInputTokensSoFar,
    openAIOutputTokensSoFar,
  );
  return { visited, systemsUsed };
}


// sets up a chatParamInvocation with nodes, customParams, and modelParams
// If usePreMadeChatParam is true, it will create & use the a PreMadeChatParam for the chatParamInvocation
export async function setUpChatParamInvocationWithNodes(
  nodes: ConversationNodeInput[],
  customParams: Partial<CustomParams> = {},
  modelParams: Partial<ModelParams> = {},
  usePreMadeChatParam: boolean = false,
): Promise<ChatParamInvocationWithNodes> {
  // Create the conversation nodes
  const createNodesRequest = createMocks({
    method: "POST",
    body: { nodes },
  });

  await createConvoNodesHandler(createNodesRequest.req, createNodesRequest.res);

  // Assert that the handler successfully created the nodes
  expect(createNodesRequest.res._getStatusCode()).toBe(201);
  const createConvoNodeResponse = JSON.parse(createNodesRequest.res._getData());
  expect(createConvoNodeResponse.message).toEqual(
    `Successfully created ${createConvoNodeResponse.data.length} conversation nodes`,
  );

  // Create the chatParamInvocation using the handler
  let createChatParamInvocationRequest;

  // using preMadeChatParam
  if (usePreMadeChatParam) {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        name: "name",
        modelParams: modelParams,
        customParams: customParams,
        conversationNodes: createConvoNodeResponse.data,
      },
    });

    await createPreMadeChatParamHandler(req, res);

    expect(res._getStatusCode()).toBe(201);

    const createdPreMadeChatParam = JSON.parse(res._getData());

    createChatParamInvocationRequest = createMocks({
      method: "POST",
      body: {
        modelParams: {},
        customParams: {},
        preMadeChatParamId: createdPreMadeChatParam.id,
      },
    });

    // no premade ChatParam
  } else {
    createChatParamInvocationRequest = createMocks({
      method: "POST",
      body: {
        modelParams,
        customParams,
        conversationNodes: createConvoNodeResponse.data,
      },
    });
  }

  await createChatParamInvocationHandler(
    createChatParamInvocationRequest.req,
    createChatParamInvocationRequest.res,
  );

  // Assert that the handler successfully created the invocation
  expect(createChatParamInvocationRequest.res._getStatusCode()).toBe(201);

  const chatParamInvocationCreated = JSON.parse(
    createChatParamInvocationRequest.res._getData(),
  );

  // Fetch the created chatParamInvokation
  const getChatParamInvokationReq = createMocks({
    method: "POST",
    body: { id: chatParamInvocationCreated.id },
  });

  await getChatParamInvokationHandler(
    getChatParamInvokationReq.req,
    getChatParamInvokationReq.res,
  );

  const chatParamInvocation = JSON.parse(
    getChatParamInvokationReq.res._getData(),
  );
  return chatParamInvocation;
}
