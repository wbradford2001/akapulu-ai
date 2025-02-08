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



const TEST_USER_ID = "clerk_test_verify_input_nested_user_options";
const TEST_EMAIL = "test+clerk_test_verify_input_nested_user_options@example.com";
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
    
    // Define common option nodes
    const aiDetailOptions: ConversationNodeInput[] = [
      
      {
            name: "User - Favorite - AI Detail - timeSeriesOption",
            role: "user",
            expectedSpeech: "Time series forecasting",
            nextName:"AI - What is your least favorite topic?",
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            },
            {
            name: "User - Favorite - AI Detail - nlp option",
            role: "user",
            expectedSpeech: "natural language processing",
            nextName: null,
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            },
            {
            name: "User - Favorite - AI Detail - supply chain optimization",
            role: "user",
            expectedSpeech: "supply chain optimization",
            nextName: null,
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            }
        ];
        
        const leastFavoriteOptions: ConversationNodeInput[] = [
            {
            name: "User - Least Favorite - Compilers",
            role: "user",
            expectedSpeech: "compilers",
            nextName: "AI - Goodbye",
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            },
            {
            name: "User - Least Favorite - Databases",
            role: "user",
            expectedSpeech: "databases",
            nextName: null,
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            },
            {
            name: "User - Least Favorite - OS",
            role: "user",
            expectedSpeech: "operating systems",
            nextName: null,
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            }
        ];
        
        const favoriteTopicOptions: ConversationNodeInput[] = [
            {
            name: "User - Favorite - AI",
            role: "user",
            expectedSpeech: "artificial intelligence",
            nextName: "AI - Fav topic - AI - Response",
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            },
            {
            name: "User - Favorite - Networking",
            role: "user",
            expectedSpeech: "computer networking",
            nextName: null,
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            },
            {
            name: "User - Favorite - Cloud Computing",
            role: "user",
            expectedSpeech: "cloud computing",
            nextName: null,
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            }
        ];
        
        const nodes: ConversationNodeInput[] = [
            {
            name: "AI - greeting",
            role: "AI",
            expectedSpeech: "Hello! Are you ready for your interview?",
            nextName: "User - Greeting Response",
            aiWordForWord: true,
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
            },
            {
            name: "User - Greeting Response",
            role: "user",
            expectedSpeech: "affirm they’re ready for the interview",
            nextName: "AI - What's your fav topic?",
            verifySpeech: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "dummyFallBack"
            },
            {
            name: "AI - What's your fav topic?",
            role: "AI",
            expectedSpeech: "What is your favorite topic in computer science?",
            nextName: "User - Fav topic response OPTIONS NODE",
            aiWordForWord: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
            },
            {
            name: "User - Fav topic response OPTIONS NODE",
            role: "user",
            expectedSpeech: "",
            verifySpeech: true,
            nextName: null,
            isStart: false,
            isEnd: false,
            options: favoriteTopicOptions.map(opt => opt.name),
            fallbackNodeName: "User - Fav topic response FALLBACK NODE",
            userId: TEST_USER_ID,
            nodeType: "options"
            },
            {
            name: "User - Fav topic response FALLBACK NODE",
            role: "AI",
            expectedSpeech: "I didn’t recognize your favorite topic.",
            nextName: "User - Fav topic response OPTIONS NODE",
            aiWordForWord: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "fallback"
            },
            {
            name: "AI - Fav topic - AI - Response",
            role: "AI",
            expectedSpeech: "Which one of the following is your favorite topic in artificial intelligence?",
            nextName: "USER - Fav Topic - AI - USER OPTIONS NODE",
            aiWordForWord: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
            },
            {
            name: "USER - Fav Topic - AI - USER OPTIONS NODE",
            role: "user",
            expectedSpeech: "",
            verifySpeech: true,
            nextName: null,
            isStart: false,
            isEnd: false,
            options: aiDetailOptions.map(opt => opt.name),
            fallbackNodeName: "AI - Fav Topic - AI - FALLBACK NODE",
            userId: TEST_USER_ID,
            nodeType: "options"
            },
            {
            name: "AI - Fav Topic - AI - FALLBACK NODE",
            role: "AI",
            expectedSpeech: "I didn’t recognize that topic in artificial intelligence.",
            nextName: "USER - Fav Topic - AI - USER OPTIONS NODE",
            aiWordForWord: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "fallback"
            },
            {
            name: "AI - What is your least favorite topic?",
            role: "AI",
            expectedSpeech: "What is your least favorite topic in computer science?",
            nextName: "USER - Least Favorite topic OPTIONS NODE",
            aiWordForWord: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
            },
            {
            name: "USER - Least Favorite topic OPTIONS NODE",
            role: "user",
            expectedSpeech: "",
            verifySpeech: true,
            nextName: null,
            isStart: false,
            isEnd: false,
            options: leastFavoriteOptions.map(opt => opt.name),
            fallbackNodeName: "AI - Least Favorite topic FALLBACK NODE",
            userId: TEST_USER_ID,
            nodeType: "options"
            },
            {
            name: "AI - Least Favorite topic FALLBACK NODE",
            role: "AI",
            expectedSpeech: "I didn’t recognize your least favorite topic.",
            nextName: "USER - Least Favorite topic OPTIONS NODE",
            aiWordForWord: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "fallback"
            },
            {
            name: "AI - Goodbye",
            role: "AI",
            expectedSpeech: "Okay great, the interview is done. Bye!",
            nextName: null,
            aiWordForWord: true,
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
            },
            ...favoriteTopicOptions,
            ...aiDetailOptions,
            ...leastFavoriteOptions,
          // dummy fallback 
          {
            name: "dummyFallBack",
            role: "AI",
            expectedSpeech: "I couldn't quite understand that",
            nextName: null,
            aiWordForWord: true,
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
            },                     
        ];
    const modelParams = { system: "You are an AI bot that is giving an interview to a student for a computer science job. " }
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, {}, modelParams)
    await runTraverseSession({
        filename: "verifyInputNestedOptions",
        chatParamInvocation,
        thingsToSay: [
            "Hello",
            "Yes",
            "Not sure what to say here",
            "Artificial intelligence",
            "Time series forecasting",
            "I’m not sure what to say here"
        ],
        overRideIndex: 5, 
        overRideOptionsToUserNode: "User - Least Favorite - Compilers"
    });


    const transcriptsToMatch: TranscriptRow[][] = [
        [
          createTranscriptRow({
            role: "AI",
            content: "Hello! Are you ready for your interview?",
            chatParamInvocationId: chatParamInvocation.id,
            order: 1,
          }),
          createTranscriptRow({
            role: "user",
            content: "Yes",
            chatParamInvocationId: chatParamInvocation.id,
            order: 2,
          }),
          createTranscriptRow({
            role: "AI",
            content: "What is your favorite topic in computer science?",
            chatParamInvocationId: chatParamInvocation.id,
            order: 3,
          }),
          createTranscriptRow({
            role: "user",
            content: "Not sure what to say here",
            chatParamInvocationId: chatParamInvocation.id,
            order: 4
          }),
          createTranscriptRow({
            role: "AI",
            content: "I didn’t recognize your favorite topic.",
            chatParamInvocationId: chatParamInvocation.id,
            order: 5,
          }),
          createTranscriptRow({
            role: "user",
            content: "Artificial intelligence",
            chatParamInvocationId: chatParamInvocation.id,
            order: 6,
          }),
          createTranscriptRow({
            role: "AI",
            content: "Which one of the following is your favorite topic in artificial intelligence?",
            chatParamInvocationId: chatParamInvocation.id,
            order: 7,
          }),
          createTranscriptRow({
            role: "user",
            content: "Time series forecasting",
            chatParamInvocationId: chatParamInvocation.id,
            order: 8
          }),
          createTranscriptRow({
            role: "AI",
            content: "What is your least favorite topic in computer science?",
            chatParamInvocationId: chatParamInvocation.id,
            order: 9,
          }),
          createTranscriptRow({
            role: "user",
            content: "I’m not sure what to say here",
            chatParamInvocationId: chatParamInvocation.id,
            order: 10,
          }),
          createTranscriptRow({
            role: "AI",
            content: "Okay great, the interview is done. Bye!",
            chatParamInvocationId: chatParamInvocation.id,
            order: 11
          })
        ]
      ];

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
