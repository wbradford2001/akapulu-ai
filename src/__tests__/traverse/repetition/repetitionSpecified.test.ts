import { runTraverseSession } from "../../../utils/testing/runTraverseSession";
import { initializeTestUser, cleanupTestUser } from "../../../utils/testing/testHelper";
import { prisma } from "../../../lib/prisma";
import { ConversationNode, TranscriptRow } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";

import {setUpChatParamInvocationWithNodes} from "../../../utils/testing/runTraverseSession"
import { createMocks } from "node-mocks-http";
import getChatParamInvokationHandler from "../../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation"


import { ConversationNodeInput } from "../../../utils/conversationNode/createConversationNode";
import { validateTraversal } from "../../../utils/testing/traverseValidation";

import createTranscriptRow from "../../../utils/testing/createTranscriptRow";

jest.setTimeout(180000); // 30 seconds timeout for all tests in this file



const TEST_USER_ID = "clerk_test_repetiition_specified";
const TEST_EMAIL = "test+clerk_test_regular_ai_word_for_word@example.com";
const SIGNING_SECRET = process.env.SIGNING_SECRET as string;


jest.mock("@clerk/nextjs/server", () => ({
  ...jest.requireActual("@clerk/nextjs/server"),
  getAuth: jest.fn(),
}));




describe("Conversation Traversal Handler Tests", () => {


    beforeEach(() => {
        // Mock Clerk's getAuth to simulate an authenticated user
        (getAuth as jest.Mock).mockReturnValue({ userId: TEST_USER_ID });
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });
  beforeAll(async () => {
    await initializeTestUser({
      userId: TEST_USER_ID,
      email: TEST_EMAIL,
      signingSecret: SIGNING_SECRET,
      hasImage: false,
      imageUrl: null,
    });
  });

  afterAll(async () => {
    await cleanupTestUser({
      userId: TEST_USER_ID,
      signingSecret: SIGNING_SECRET,
    });

    await prisma.conversationNode.deleteMany({ where: { userId: TEST_USER_ID } }); // Clean up ConversationNodes
    await prisma.chatParamInvocation.deleteMany({ where: { userId: TEST_USER_ID } });
  });

  it("Tests a simple 3-node conversation script", async () => {
    // Create ConversationNodes using the handler
    const nodes: ConversationNodeInput[] = [
      
      {
        role: "user",
        expectedSpeech: "Hello! I am ready for my exam",
        verifySpeech: false,
        nextName: "ai question",
        isStart: true,
        isEnd: false,
        options: [],
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        name: "user start", 
        nodeType: "regular",               

      },
      {
        name: "ai question",
        role: "AI",
        nextName: "finish",
        traverseNumberOfOptions: 3,
        isStart: false,
        isEnd: false,
        options: ["aiOption", "aiOption", "aiOption"],
        userId: TEST_USER_ID,
        nodeType: "options",               
 
      },
      {
        name: "aiOption",
        role: "AI",
        expectedSpeech: "question 1 here",
        aiWordForWord: true,
        nextName: "userOption",
        traverseNumberOfOptions: 3,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        nodeType: "regular",               
 
      },      
      {
        name: "userOption",
        role: "user",
        expectedSpeech: "question 1 answer",
        nextName: null,
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        nodeType: "regular",               


      },
      {
        role: "AI",
        expectedSpeech: "exam finished!",
        aiWordForWord: true,
        nextName: null,
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: true,
        options: [],
        userId: TEST_USER_ID,
        name: "finish",
        nodeType: "regular",               

      }
    ];

    const modelParams = { system: "You are a teacher, giving a verbal exam to a computer science student" }
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, {}, modelParams)

    await runTraverseSession({
        filename: "repetitionSpecified",
        chatParamInvocation
    });


    const nodeMap: Record<string, ConversationNode> = {}
    for (const node of nodes){
      nodeMap[node.name] = node as ConversationNode
    }

    const transcriptsToMatch: TranscriptRow[][] = [

        [
      
            createTranscriptRow({
              role: "user",
              content: "Hello! I am ready for my exam",
              chatParamInvocationId: chatParamInvocation.id,
              order: 1, 
      
            }),
            createTranscriptRow({
              role: "AI",
              content: "question 1 here", 
              chatParamInvocationId: chatParamInvocation.id,
              order: 2
            }),
            createTranscriptRow({
              role: "user",
              content: "question 1 answer",             
              chatParamInvocationId: chatParamInvocation.id,
              order: 3
            }),
            createTranscriptRow({
                role: "AI",
                content: "question 1 here", 
                chatParamInvocationId: chatParamInvocation.id,
                order: 4
         
              }),
              createTranscriptRow({
                role: "user",
                content: "question 1 answer",             
                chatParamInvocationId: chatParamInvocation.id,
                order: 5
              }),
              createTranscriptRow({
                role: "AI",
                content: "question 1 here", 
                chatParamInvocationId: chatParamInvocation.id,
                order: 6
         
              }),
              createTranscriptRow({
                role: "user",
                content: "question 1 answer",             
                chatParamInvocationId: chatParamInvocation.id,
                order: 7
              }),
            createTranscriptRow({
              role: "AI",
              content: "exam finished!",  
              chatParamInvocationId: chatParamInvocation.id,
              order: 8
            }),
          ]
    ]

    const getChatParamInvocationRequest = createMocks({
      method: "POST",
      body: {
        id: chatParamInvocation.id
      },
    });
    await getChatParamInvokationHandler(getChatParamInvocationRequest.req, getChatParamInvocationRequest.res)
    const chatParamInvocationWithTranscript = JSON.parse(getChatParamInvocationRequest.res._getData());

    if (!chatParamInvocationWithTranscript || chatParamInvocationWithTranscript.error){
        throw new Error("We can't find the chatParamInvokation")
    }
    const transcript: TranscriptRow[] = chatParamInvocationWithTranscript.transcript
    expect(validateTraversal({transcriptsToMatch, transcript}).isValid).toBeTruthy()
  });

});
