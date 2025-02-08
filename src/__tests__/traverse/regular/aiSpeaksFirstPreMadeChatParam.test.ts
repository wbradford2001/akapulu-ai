import { runTraverseSession } from "../../../utils/testing/runTraverseSession";
import { initializeTestUser, cleanupTestUser } from "../../../utils/testing/testHelper";
import { prisma } from "../../../lib/prisma";
import { ConversationNode, TranscriptRow } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";
import { ConversationNodeInput } from "../../../utils/conversationNode/createConversationNode";
import { validateTraversal } from "../../../utils/testing/traverseValidation";
import { createMocks } from "node-mocks-http";

import createTranscriptRow from "../../../utils/testing/createTranscriptRow";
import getChatParamInvokationHandler from "../../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation"

jest.setTimeout(180000); // 30 seconds timeout for all tests in this file



const TEST_USER_ID = "clerk_test_ai_speaks_first";
const TEST_EMAIL = "test+clerk_clerk_test_ai_speaks_first@example.com";
const SIGNING_SECRET = process.env.SIGNING_SECRET as string;


jest.mock("@clerk/nextjs/server", () => ({
  ...jest.requireActual("@clerk/nextjs/server"),
  getAuth: jest.fn(),
}));


import {setUpChatParamInvocationWithNodes} from "../../../utils/testing/runTraverseSession"

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
        role: "AI",
        expectedSpeech: "Hello! the first question is what is an operating system?",
        aiWordForWord: true,
        nextName: "node3",
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node2",
        nodeType: "regular",               
 
      },
      {
        role: "user",
        expectedSpeech: "An operating system is a piece of software that manages a computers resources for it's users",
        nextName: "node4",
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node3",
        nodeType: "regular",               


      },
      {
        role: "AI",
        expectedSpeech: "Correct ! You have passed the test. How do you feel?",
        aiWordForWord: true,
        nextName: "node5",
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node4",
        nodeType: "regular",               

      },
      {
        role: "user",
        expectedSpeech: "Great!",
        nextName: "node6",
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node5",
        nodeType: "regular",               

      },
      {
        role: "AI",
        expectedSpeech: "Excellent! have a great day!",
        aiWordForWord: true,
        traverseNumberOfOptions: null,
        nextName: null,
        isStart: false,
        isEnd: true,
        options: [],
        userId: TEST_USER_ID,
        name: "node6",
        nodeType: "regular",               

      },
    ];

    const modelParams = { system: "You are a teacher, giving a verbal exam to a computer science student" }
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, {}, modelParams, true)

    await runTraverseSession({
      filename: "aiSpeaksFirstPreMadeChatParam",
      chatParamInvocation
    });

    
        const nodeMap: Record<string, ConversationNode> = {}
    for (const node of nodes){
      nodeMap[node.name] = node as ConversationNode
    }

    const transcriptsToMatch: TranscriptRow[][] = [

        [
            createTranscriptRow({
              role: "AI",
              content: "Hello! the first question is what is an operating system?", 
              chatParamInvocationId: chatParamInvocation.id,
              order: 1
       
            }),
            createTranscriptRow({
              role: "user",
              content: "An operating system is a piece of software that manages a computers resources for it's users",             
              chatParamInvocationId: chatParamInvocation.id,
              order: 2
            }),
            createTranscriptRow({
              role: "AI",
              content: "Correct ! You have passed the test. How do you feel?",
              chatParamInvocationId: chatParamInvocation.id,
              order: 3
      
            }),
            createTranscriptRow({
              role: "user",
              content: "Great!",              
              chatParamInvocationId: chatParamInvocation.id,
              order: 4
            }),
            createTranscriptRow({
              role: "AI",
              content: "Excellent! have a great day!",  
              chatParamInvocationId: chatParamInvocation.id,
              order: 5
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

    // check we created the dummy user node
    expect(chatParamInvocation.conversationNodes).toHaveLength(6)

    
  });

});
