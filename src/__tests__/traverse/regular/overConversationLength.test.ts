import { runTraverseSession, setUpChatParamInvocationWithNodes } from "../../../utils/testing/runTraverseSession";
import { initializeTestUser, cleanupTestUser } from "../../../utils/testing/testHelper";
import { prisma } from "../../../lib/prisma";
import { ConversationNode, TranscriptRow } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";

import { createMocks } from "node-mocks-http";
import getChatParamInvokationHandler from "../../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation"

import { ConversationNodeInput } from "../../../utils/conversationNode/createConversationNode";


jest.setTimeout(180000); // 30 seconds timeout for all tests in this file



const TEST_USER_ID = "clerk_test_over_conversation_length";
const TEST_EMAIL = "test+clerk_test_over_conversation_length@example.com";
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

  it("Tests going over maxTokens", async () => {
    // Create ConversationNodes using the handler
    const nodes: ConversationNodeInput[] = [
      
      {
        role: "user",
        expectedSpeech: "Hello! I am ready for my exam",
        nextName: "node2",
        isStart: true,
        isEnd: false,
        options: [],
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        name: "node1", 
        nodeType: "regular",               

      },
      {
        role: "AI",
        expectedSpeech: "Hello! the first question is what is an operating system?",
        aiWordForWord: false,
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
        aiWordForWord: false,
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
        aiWordForWord: false,
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

    const modelParams =  { system: "You are a teacher, giving a verbal exam to a computer science student" }
    const customParams =  { maxTime: 100000, maxTokens: 1}
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes,customParams, modelParams)
    await runTraverseSession({
      filename: "overConversationLength1",
      chatParamInvocation
    });



    const nodeMap: Record<string, ConversationNode> = {}
    for (const node of nodes){
      nodeMap[node.name] = node as ConversationNode
    }


    const chatParamInvocationWithTranscript = await prisma.chatParamInvocation.findUnique({
        where: { 
          id: chatParamInvocation.id, 
        },
        include: {
          transcript: true, // includes the array of TranscriptRow objects
        },
      })

    if (!chatParamInvocationWithTranscript){
        throw new Error("We can't find the chatParamInvokation")
    }

    expect(chatParamInvocationWithTranscript.transcript.length).toBe(4)
  });
  it("Tests going over maxTime", async () => {
    // Create ConversationNodes using the handler
    const nodes: ConversationNodeInput[] = [
      
      {
        role: "user",
        expectedSpeech: "Hello! I am ready for my exam",
        nextName: "node2",
        isStart: true,
        isEnd: false,
        options: [],
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        name: "node1", 
        nodeType: "regular",               

      },
      {
        role: "AI",
        expectedSpeech: "Hello! the first question is what is an operating system?",
        aiWordForWord: false,
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
        aiWordForWord: false,
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
        aiWordForWord: false,
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
    
    const modelParams =  { system: "You are a teacher, giving a verbal exam to a computer science student" }
    const customParams =  { maxTime: 10, maxTokens: 3000}
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes,customParams, modelParams)
    await runTraverseSession({
      filename: "overConversationLength2",
      chatParamInvocation
    });



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
    expect(transcript.length).toBe(2)
  });


});
