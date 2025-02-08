import { runTraverseSession, setUpChatParamInvocationWithNodes } from "../../../utils/testing/runTraverseSession";
import { initializeTestUser, cleanupTestUser } from "../../../utils/testing/testHelper";
import { prisma } from "../../../lib/prisma";
import { ConversationNode } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";


import { ConversationNodeInput, createConversationNode } from "../../../utils/conversationNode/createConversationNode";

import { validateTraversal } from "../../../utils/testing/traverseValidation";

jest.setTimeout(180000); // 30 seconds timeout for all tests in this file



const TEST_USER_ID = "clerk_test_convo_traverse_1";
const TEST_EMAIL = "test+clerk_test_convo_traverse_1@example.com";
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
        expectedSpeech: "Hey! Sorry to bother you, my name is William, and we're just helping some of the homes in the area take advantage of the new government solar programs, have you had a chance to talk with someone about this already?.",
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
        expectedSpeech: "Say something in line with the converstion, but not to throw the script off.",
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
        expectedSpeech: "There's actually a new government program that lets you get solar program with no out of pocket costs, but only certain home owners qualify. Have you seen if you're house qualifies yet?",
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
        expectedSpeech: "Say something in line with the converstion, but not to throw the script off.",
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
        expectedSpeech: "So all we need to know to see if you qualify is if your electricity bill is over a certain amount. What was your electricity bill last time you checked?",
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
        expectedSpeech: "Say you're in a rush and you have to go",
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
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, {}, {})
    const {  visited } = await runTraverseSession({
      filename: "regular",
      chatParamInvocation
    });

    // populate node dict for validation purposes
    const nodeDict: Record<string, Omit<ConversationNode, 'id' | 'createdAt' | 'updatedAt'>> = {}
    for (const node of nodes){
      nodeDict[node.name] = createConversationNode(node)
    }

    const traversal = visited
    expect(validateTraversal({traversal, nodeDict}).isValid).toBeTruthy()
  });

});
