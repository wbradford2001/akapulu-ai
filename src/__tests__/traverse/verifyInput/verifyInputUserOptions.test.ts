import { runTraverseSession, setUpChatParamInvocationWithNodes } from "../../../utils/testing/runTraverseSession";
import { initializeTestUser, cleanupTestUser } from "../../../utils/testing/testHelper";
import { prisma } from "../../../lib/prisma";
import { TranscriptRow } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";


import { ConversationNodeInput } from "../../../utils/conversationNode/createConversationNode";
import { validateTraversal } from "../../../utils/testing/traverseValidation";
import { createMocks } from "node-mocks-http";
import getChatParamInvokationHandler from "../../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation"

import createTranscriptRow from "../../../utils/testing/createTranscriptRow";

jest.setTimeout(180000); // 30 seconds timeout for all tests in this file



const TEST_USER_ID = "clerk_test_verify_input_user_options";
const TEST_EMAIL = "test+clerk_test_verify_input_user_options@example.com";
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
      // Welcome to banking support. How can I help you today?
        {
            name: "greeting",
          role: "AI",
          expectedSpeech: "Welcome to banking support. How can I help you today?",
          nextName: "optionsNode",
          aiWordForWord: true,
          isStart: true,
          isEnd: false,
          options: [],
          userId: TEST_USER_ID,
          nodeType: "regular"
        },

        // options
        {
            name: "optionsNode",
          role: "user",
          expectedSpeech: "",
          verifySpeech: true,
          isStart: false,
          isEnd: false,
          options: [
            "viewBalanceUserInput" ,
            "makePaymentUserInput" ,
            "cancelSubscriptionUserInput",
            "Nothing to helper me with"
          ],
          userId: TEST_USER_ID,
          nodeType: "options",
          fallbackNodeName: "fallBackForUserAction"
        },
        // FallBack - I couldn't quite understand that
        {
          name: "fallBackForUserAction",
          role: "AI",
          expectedSpeech: "I couldn't quite understand that",
          nextName: "optionsNode",
          aiWordForWord: true,
          isStart: false,
          isEnd: false,
          options: [],
          userId: TEST_USER_ID,
          nodeType: "fallback"
      },

        // option to viewBalanceUserInput
        {
            name: "viewBalanceUserInput",
            role: "user",
            nextName: "viewBalanceResponse",
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            expectedSpeech: "ask to view their balance"
        },        
        {
            name: "viewBalanceResponse",
          role: "AI",
          expectedSpeech: "Your current balance is $1,000. Is there anything else I can help you with?",
          isStart: false,
          nextName: "optionsNode",
          aiWordForWord: true,
          isEnd: false,
          options: [],
          userId: TEST_USER_ID,
          nodeType: "regular",
        },


        // option to makePaymentUserInput
        {
            name: "makePaymentUserInput",
            role: "user",
            nextName: "makePaymentResponse",
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            expectedSpeech: "ask to make a payment"
        },        
        {
            name: "makePaymentResponse",
            role: "AI",
            expectedSpeech: "Payment has been made! Is there anything else I can help you with?",
            isStart: false,
            aiWordForWord: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
        },


        // option to cancelSubscriptionResponse
        {
            role: "user",
            nextName: "cancelSubscriptionResponse",
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            name: "cancelSubscriptionUserInput",
            nodeType: "regular",
            expectedSpeech: "ask to cancel subscription"
        },        
        {
            role: "AI",
            expectedSpeech: "Subscription is cancelled! Is there anything else I can help you with?",
            isStart: false,
            aiWordForWord: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            name: "cancelSubscriptionResponse",
            nodeType: "regular",
        },     
        
        
        // no
        {
          role: "user",
          nextName: "goodbye",
          isStart: false,
          isEnd: false,
          options: [],
          userId: TEST_USER_ID,
          name: "Nothing to helper me with",
          nodeType: "regular",
          expectedSpeech: "There's nothing you can help me with"
      },  

        //Have a great day!
        {
          role: "AI",
          expectedSpeech: "Have a great day!",
          nextName: null,
          aiWordForWord: true,
          isStart: false,
          isEnd: true,
          options: [],
          userId: TEST_USER_ID,
          name: "goodbye",
          nodeType: "regular"
        }
      ];

    const modelParams = { system: "You are an AI phone service that takes customer support calls for a banking app" }
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, {}, modelParams)
    await runTraverseSession({
      filename: "verifyInputUserOptions",
      chatParamInvocation,
      thingsToSay: [
        "Hello",
        "order pizza",  // Invalid - should fail matching
        "view balance", // Should match viewBalanceUserInput
        "nothing else to help me with"           // Final response
      ],
      overRideIndex: 4
    });


    const transcriptsToMatch: TranscriptRow[][] = [

        [
            createTranscriptRow({
              role: "AI",
              content: "Welcome to banking support. How can I help you today?",
              chatParamInvocationId: chatParamInvocation.id,
              order: 1
            }),
            createTranscriptRow({
              role: "user",
              content: "order pizza",
              chatParamInvocationId: chatParamInvocation.id,
              order: 2
            }),
            createTranscriptRow({
              role: "AI",
              content: "I couldn't quite understand that",              
              chatParamInvocationId: chatParamInvocation.id,
              order: 3
            }),                
            createTranscriptRow({
              role: "user",
              content: "view balance",
              chatParamInvocationId: chatParamInvocation.id,
              order: 4
            }),
            createTranscriptRow({
              role: "AI",
              content: "Your current balance is $1,000. Is there anything else I can help you with?",
              chatParamInvocationId: chatParamInvocation.id,
              order: 5
            }),
            createTranscriptRow({
              role: "user",
              content: "nothing else to help me with",
              chatParamInvocationId: chatParamInvocation.id,
              order: 6
            }),
            createTranscriptRow({
              role: "AI",
              content: "Have a great day!",
              chatParamInvocationId: chatParamInvocation.id,
              order: 7
            })
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
    expect(
        validateTraversal({transcriptsToMatch, transcript}).isValid
    ).toBeTruthy()
  });

});
