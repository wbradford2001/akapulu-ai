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



const TEST_USER_ID = "clerk_test_verify_input_no_options";
const TEST_EMAIL = "test+clerk_test_verify_input_no_options@example.com";
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
      // Hi, can you fix my car?
      {
        role: "user",
        expectedSpeech: "ask if you can fix his car",
        nextName: "node2",
        isStart: true,
        isEnd: false,
        options: [],
        verifySpeech: true,
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        name: "node1", 
        nodeType: "regular", 
        fallbackNodeName: "fallBack for can you fix car"              

      },
      {
        role: "AI",
        expectedSpeech: "I couldn't understand that",
        nextName: "node1",
        isStart: false,
        isEnd: false,
        options: [],
        traverseNumberOfOptions: null,
        userId: TEST_USER_ID,
        name: "fallBack for can you fix car", 
        nodeType: "regular", 

      },      

      // Hello! What kind of car do you have?
      {
        role: "AI",
        expectedSpeech: "Hello! What kind of car do you have?",
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

      // Chevrolet
      {
        role: "user",
        expectedSpeech: "tell you the brand name of his car",
        nextName: "node4",
        traverseNumberOfOptions: null,
        verifySpeech: true,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node3",
        nodeType: "regular",               
        fallbackNodeName: "fallBack for can you fix car"

      },

      //What year?
      {
        role: "AI",
        expectedSpeech: "What year?",
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

      // 2016
      {
        role: "user",
        expectedSpeech: "tell you the year of his car",
        nextName: "node6",
        verifySpeech: true,
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node5",
        nodeType: "regular", 
        fallbackNodeName: "fallBackForCar"        

      },
      // FALL BACK NODE
      {
        role: "AI",
        expectedSpeech: "I couldn't quite understand that car model",
        aiWordForWord: true,
        traverseNumberOfOptions: null,
        nextName: "node5",
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "fallBackForCar",
        nodeType: "fallback",               
      },

      // Anything else you need?
      {
        role: "AI",
        expectedSpeech: "Anthing else you need?",
        aiWordForWord: true,
        traverseNumberOfOptions: null,
        nextName: "node7",
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node6",
        nodeType: "regular",               

      },

      // No
      {
        role: "user",
        expectedSpeech: "say there's nothing else he needs",
        nextName: "node8",
        verifySpeech: true,
        traverseNumberOfOptions: null,
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "node7",
        fallbackNodeName: "fallBackForCar",
        nodeType: "regular",               
      },    
      // FALL BACK NODE
      {
        role: "AI",
        expectedSpeech: "I couldn't quite understand that response",
        aiWordForWord: true,
        traverseNumberOfOptions: null,
        nextName: "node7",
        isStart: false,
        isEnd: false,
        options: [],
        userId: TEST_USER_ID,
        name: "fallBackForNo",
        nodeType: "fallback",               
      },      


      // Have a great day
      {
        role: "AI",
        expectedSpeech: "Have a great day!",
        aiWordForWord: true,
        traverseNumberOfOptions: null,
        nextName: null,
        isStart: false,
        isEnd: true,
        options: [],
        userId: TEST_USER_ID,
        name: "node8",
        nodeType: "regular",               

      },        
    ];

    const modelParams = { system: "You are an AI autobody phone service, you take customer service calls" }
    const chatParamInvocation = await setUpChatParamInvocationWithNodes(nodes, {}, modelParams)
    await runTraverseSession({
      filename: "verifyInputNoOptions",
      chatParamInvocation,
      thingsToSay: [
        "Hello! Can I fix my car",
        "Chevrolet",
        "I'm not sure what to say here",
        "2016",
        "I'm not sure what to say here"
      ],
      overRideIndex: 4
    });


    const transcriptsToMatch: TranscriptRow[][] = [

        [
      
            createTranscriptRow({
              role: "user",
              content: "Hello! Can I fix my car",
              chatParamInvocationId: chatParamInvocation.id,
              order: 1
      
            }),
            createTranscriptRow({
              role: "AI",
              content: "Hello! What kind of car do you have?", 
              chatParamInvocationId: chatParamInvocation.id  ,             
              order: 2
            }),
            createTranscriptRow({
              role: "user",
              content: "Chevrolet",             
              chatParamInvocationId: chatParamInvocation.id ,
              order: 3
            }),
            createTranscriptRow({
              role: "AI",
              content: "What year?",
              chatParamInvocationId: chatParamInvocation.id ,
              order: 4
      
            }),
            createTranscriptRow({
              role: "user",
              content: "I'm not sure what to say here",              
              chatParamInvocationId: chatParamInvocation.id,
              order: 5
            }),
            createTranscriptRow({
              role: "AI",
              content: "I couldn't quite understand that car model",              
              chatParamInvocationId: chatParamInvocation.id,
              order: 6
            }),            
              createTranscriptRow({
                role: "user",
                content: "2016",              
                chatParamInvocationId: chatParamInvocation.id,
                order: 7
              }),            
            createTranscriptRow({
              role: "AI",
              content: "Anthing else you need?",  
              chatParamInvocationId: chatParamInvocation.id,
              order: 8
            }),
            createTranscriptRow({
              role: "user",
              content: "I'm not sure what to say here",              
              chatParamInvocationId: chatParamInvocation.id,
              order: 9
            }),   
            // override the fail here
            createTranscriptRow({
              role: "AI",
              content: "Have a great day!",  
              chatParamInvocationId: chatParamInvocation.id,
              order: 10
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
    expect(
        validateTraversal({transcriptsToMatch, transcript}).isValid
    ).toBeTruthy()
  });

});
