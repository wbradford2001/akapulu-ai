import { runTraverseSession, setUpChatParamInvocationWithNodes } from "../../../utils/testing/runTraverseSession";
import { initializeTestUser, cleanupTestUser } from "../../../utils/testing/testHelper";
import { prisma } from "../../../lib/prisma";
import { TranscriptRow } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";


import { ConversationNodeInput } from "../../../utils/conversationNode/createConversationNode";
// import { validateTraversal } from "../../../utils/testing/traverseValidation";
import { createMocks } from "node-mocks-http";
import getChatParamInvokationHandler from "../../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation"

// import createTranscriptRow from "../../../utils/testing/createTranscriptRow";

jest.setTimeout(180000); // 30 seconds timeout for all tests in this file



const TEST_USER_ID = "clerk_test_verify_input_repeat_until";
const TEST_EMAIL = "test+clerk_test_verify_input_repeat_until@example.com";
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
      // Hello! would you like to buy some solar panels?
      {
        role: "user",
        name: "USER - start - wanna buy solar?", 
        nextName: "AI - anything",
        expectedSpeech: "Ask if he wants to buy some solar panels",
        isStart: true,
        isEnd: false,
        options: [],
        verifySpeech: true,
        traverseNumberOfOptions: null,
        fallbackNodeName: "Dummy fallback",
        userId: TEST_USER_ID,
        nodeType: "regular",               

      },
      // dummy fallback
      {
        role: "AI",
        name: "Dummy fallback", 
        nextName: "USER - start - wanna buy solar?",
        isStart: false,
        isEnd: false,
        options: [],
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        nodeType: "regular",               

      },      

      // No thank you!
      {
        role: "AI",
        name: "AI - anything",
        expectedSpeech: "Say Anything in line with the conversaion",
        aiWordForWord: false,
        nextName: "USER - checked your electricity?",
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        nodeType: "regular",               
 
      },

      // Have you check the price of your electricity bills?
      {
        role: "user",
        name: "USER - checked your electricity?",
        expectedSpeech: "Have you check the price of your electricity bills?",
        threshold: 7,
        nextName: "AI - My bills arent that high",
        traverseNumberOfOptions: null,
        fallbackNodeName: "AI - anything",
        showVerifyFailPopUp: false,
        verifySpeech: true,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        nodeType: "regular",               


      },

      //My bills aren't that high
      {
        role: "AI",
        name: "AI - My bills arent that high",
        expectedSpeech: "say your electricity bills aren't that high",
        aiWordForWord: false,
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: true,
        options: [],
        userId: TEST_USER_ID,
        nodeType: "regular",               

      },

    ];

    const modelParams = { system: "You are a homeowner, and there is a solar panel salesman at your door" }
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, {}, modelParams)
    await runTraverseSession({
      filename: "repeatUntil",
      chatParamInvocation,
      thingsToSay: [
        "Hello! would you like to buy some solar panels?",
        "What are your thoughts on solar panels",
        "Do you like they way the solar panels look?",
        "Have you check the price of your electricity bills?",
      ],
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
    expect(transcript.length).toBe(8)

  });

});
