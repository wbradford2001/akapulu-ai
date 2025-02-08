import { createMocks } from "node-mocks-http";
import createConvoNodesHandler from "../../pages/api/convoNodes/createConvoNode";
import { getAuth } from "@clerk/nextjs/server";

import { ConversationNodeInput, createConversationNode } from "../../utils/conversationNode/createConversationNode";
import { initializeTestUser, cleanupTestUser } from "../../utils/testing/testHelper";
import { ConversationNode } from "@prisma/client";

jest.mock("@clerk/nextjs/server", () => ({
    ...jest.requireActual("@clerk/nextjs/server"),
    getAuth: jest.fn(),
  }));


describe("Create Conversation Nodes API", () => {
    const TEST_USER_ID = "clerk_test_convo_nodes";
    const TEST_EMAIL = "test+clerk_test_convo_nodes@example.com";
    const SIGNING_SECRET = process.env.SIGNING_SECRET as string;
  
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
    });
  it("creates conversation nodes", async () => {
    const nodesToCreate: ConversationNodeInput[] = [
      {
        role: "AI",
        expectedSpeech: "Hello! how can I help you?",
        nextName: "node3",

        isStart: false,
        isEnd: false,
        options: [],
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        name: "node2",      
        nodeType: "regular",              
      },
      {
        role: "user",
        expectedSpeech: "Can you tell me about your services?",
        isEnd: true,

        isStart: false,
        options: [],
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        name: "node3",      
        nodeType: "regular",            
      },
    ]
    const { req, res } = createMocks({
      method: "POST",
      body: {
        nodes: nodesToCreate
      },
    });

    await createConvoNodesHandler(req, res);

    const createdNodes = nodesToCreate.map((inputNode)=>{return createConversationNode(inputNode)})

    expect(res._getStatusCode()).toBe(201);

    const rawResponse = JSON.parse(res._getData())
    const dataWithoutTimestamps = rawResponse.data?.map((node: ConversationNode) => {
      const { createdAt, updatedAt,id,  ...rest } = node;

      // avoid type error
      if (createdAt && updatedAt && id){
        
      }
      return rest;
    });

    // validate response recieve with createdNodes
    expect(dataWithoutTimestamps[0]).toEqual(
        createConversationNode({
            role: "user",
            expectedSpeech: "Hello",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            userId: TEST_USER_ID,
            ignoreInTranscript: true,
            name: "initial_user_node",
            nodeType: "regular",       
        })
    )

    expect(dataWithoutTimestamps.slice(1,)).toEqual(createdNodes);
  });
});