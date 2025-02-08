import { runTraverseSession } from "../../../utils/testing/runTraverseSession";
import { initializeTestUser, cleanupTestUser } from "../../../utils/testing/testHelper";
import { prisma } from "../../../lib/prisma";
import { ConversationNode } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";

import { endingString, doNotReturnAnything } from "../../../pages/api/chat/traverse";

import { setUpChatParamInvocationWithNodes } from "../../../utils/testing/runTraverseSession"


import { ConversationNodeInput } from "../../../utils/conversationNode/createConversationNode";

jest.setTimeout(180000); // 30 seconds timeout for all tests in this file



const TEST_USER_ID = "clerk_test_custom_prompts";
const TEST_EMAIL = "test+clerk_test_custom_prompts@example.com";
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
        expectedSpeech: "Hello?",
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
        expectedSpeech: "Greet them and ask you you can help them",
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
        expectedSpeech: "My laptop isn't working",
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
        expectedSpeech: "Ask them if they tried restarting it",
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
        expectedSpeech: "I just tried it, it worked, thanks!",
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
        expectedSpeech: "Say you hope they have a great day",
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
    const modelParams = { system: "You are an AI phone answering machine, taking customer service calls for laptops" }
    const customParams = {attitude: "Assistant", conversationType: "Phone Call"}
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, customParams, modelParams, true)

    const { systemsUsed } = await runTraverseSession({
      filename: "customPromptsPreMade",
      chatParamInvocation,
    });


    const nodeMap: Record<string, ConversationNode> = {}
    for (const node of nodes){
      nodeMap[node.name] = node as ConversationNode
    }
    const expectedSystemsUsed =     [
      'You are an AI phone answering machine, taking customer service calls for laptopsPlease respond to the user based on the following idea: \n' +
        '\n' +
        '    (Greet them and ask you you can help them), \n' +
        '\n' +
        '    and in a way that is consistent with the conversaion.\n' +
        '\n' +
        'The conversation is of type: Phone Call.\n' +
        'Your attitude should be: Assistant.\n' +
        doNotReturnAnything,
      'You are an AI phone answering machine, taking customer service calls for laptopsPlease respond to the user based on the following idea: \n' +
        '\n' +
        '    (Ask them if they tried restarting it), \n' +
        '\n' +
        '    and in a way that is consistent with the conversaion.\n' +
        '\n' +
        'The conversation is of type: Phone Call.\n' +
        'Your attitude should be: Assistant.\n' +
        doNotReturnAnything,
      'You are an AI phone answering machine, taking customer service calls for laptopsPlease respond to the user based on the following idea: \n' +
        '\n' +
        '    (Say you hope they have a great day), \n' +
        '\n' +
        '    and in a way that is consistent with the conversaion.\n' +
        '\n' +
        'The conversation is of type: Phone Call.\n' +
        'Your attitude should be: Assistant.\n' +
        doNotReturnAnything +
        endingString
    ]
      
      expect(systemsUsed).toEqual(expectedSystemsUsed);

    });

});
