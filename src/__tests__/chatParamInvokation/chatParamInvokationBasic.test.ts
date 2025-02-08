import { createMocks } from "node-mocks-http";
import { getAuth } from "@clerk/nextjs/server";

import { initializeTestUser, cleanupTestUser } from "../../utils/testing/testHelper";
import createConvoNodesHandler from "../../pages/api/convoNodes/createConvoNode";
import {ConversationNodeInput} from "../../utils/conversationNode/createConversationNode";
import {findNodeByRole} from "../../utils/testing/testHelper"
import createChatParamInvocationHandler from "../../pages/api/chatParam/chatParamInvokation/createChatParamInvokation";
import getChatParamInvokationHandler from "../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation";
import getChatParamInvokationsHandler from "../../pages/api/chatParam/chatParamInvokation/getChatParamInvokations";

import { defaultModelParams, defaultCustomParams } from "../../utils/chatParamInvokation/chatParamInvokationDefaults";
import generateRandomParams from "../../utils/chatParamInvokation/generateRandomParam";

jest.mock("@clerk/nextjs/server", () => ({
    ...jest.requireActual("@clerk/nextjs/server"),
    getAuth: jest.fn(),
  }));

describe("Test Chat Param Invocation", () => {
  const TEST_USER_ID = "clerk_test_chat_param_invokation_crud";
  const TEST_EMAIL = "test+clerk_test_chat_param_invokation_crud@example.com";
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

  it("Creates and retrieves multiple chatParamInvocations", async () => {
    const conversationNodes: ConversationNodeInput[] = [
          
          {
            role: "user",
            expectedSpeech: "Hello! I am ready for my exam",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            ignoreInTranscript: true,
            traverseNumberOfOptions: null,
            userId: TEST_USER_ID,
            name: "node1", 
            nodeType: "regular",               

          },
          {
            role: "AI",
            expectedSpeech: "Hello! the first question is what is an operating system?",
            aiWordForWord: true,
            traverseNumberOfOptions: null,
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            name: "node2",
            nodeType: "regular",               
    
          },
        ]


    // create conversation nodes 
      const createConvoNodesReq = createMocks({
        method: "POST",
        body: {
          nodes: conversationNodes,
        },
      });

      await createConvoNodesHandler(createConvoNodesReq.req, createConvoNodesReq.res);

      expect(createConvoNodesReq.res._getStatusCode()).toBe(201);
      const convoNodes = JSON.parse(createConvoNodesReq.res._getData()).data;    


    const chatParamInvocations= [
      // Test case 1: Generate random values
      { name: "name1", 
        modelParams: {...generateRandomParams(defaultModelParams)}, 
        customParams:  {...generateRandomParams(defaultCustomParams)},
        conversationNodes: convoNodes
      },
      // Test case 2: Generate random values
      {
        name: "name2", 
        modelParams: {...generateRandomParams(defaultModelParams)}, 
        customParams:  {...generateRandomParams(defaultCustomParams)},
        conversationNodes: convoNodes
      },
      // Test case 3: Use default values
      { name: "name3",
        conversationNodes: convoNodes
      },
    ];
    {
      const { req, res } = createMocks({
        method: "GET",
      });

      await getChatParamInvokationsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const initialData = JSON.parse(res._getData());
      expect(initialData).toEqual([]);
    }

    const createdIds = new Map<string, Record<string, unknown>>();

    for (const parentParams of chatParamInvocations) {
      // Merge modelParams
      const mergedModelParams = Object.fromEntries(
        Object.entries(defaultModelParams).map(([key, definition]) => [
          key,
          parentParams.modelParams?.[key] !== undefined
            ? parentParams.modelParams[key]
            : definition.default,
        ])
      );
    
      // Merge customParams
      const mergedCustomParams = Object.fromEntries(
        Object.entries(defaultCustomParams).map(([key, definition]) => [
          key,
          parentParams.customParams?.[key] !== undefined
            ? parentParams.customParams[key]
            : definition.default,
        ])
      );
    
      const { req, res } = createMocks({
        method: "POST",
        body: {
          name: parentParams.name,
          modelParams: mergedModelParams,
          customParams: mergedCustomParams,
          conversationNodes: parentParams.conversationNodes
        },
      });
    
      await createChatParamInvocationHandler(req, res);
    
      expect(res._getStatusCode()).toBe(201);
    
      const createdInvocation = JSON.parse(res._getData());
            
    
      // Save merged parameters into createdIds for later validation
      createdIds.set(createdInvocation.id, {
        name: parentParams.name,
        modelParams: mergedModelParams,
        customParams: mergedCustomParams,
        userId: TEST_USER_ID
      });
    }
    // Verify each created chatParamInvokation
    for (const [id, expectedParams] of createdIds.entries()) {
      const { req, res } = createMocks({
        method: "POST",
        body: { id }
      });

      await getChatParamInvokationHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const fetchedInvocation = JSON.parse(res._getData());

      expect(fetchedInvocation.userId).toEqual(expectedParams.userId);
      expect(fetchedInvocation.modelParams).toEqual(expectedParams.modelParams);
      expect(fetchedInvocation.customParams).toEqual(expectedParams.customParams);
      
      

      const firstNode = findNodeByRole(fetchedInvocation.conversationNodes, "user");
      if (!firstNode) {
        throw new Error("No user node found");
      }
      expect(firstNode.expectedSpeech).toEqual("Hello! I am ready for my exam");

      const secondNode = findNodeByRole(fetchedInvocation.conversationNodes, "AI");
      if (!secondNode) {
        throw new Error("No user node found");
      }
      expect(secondNode.expectedSpeech).toEqual("Hello! the first question is what is an operating system?");
        

      
    }

    // Verify all chatParamInvokations
    {
      const { req, res } = createMocks({
        method: "GET",
      });

      await getChatParamInvokationsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const fetchedData = JSON.parse(res._getData());

      expect(fetchedData).toHaveLength(chatParamInvocations.length);
      for (const fetchedInvocation of fetchedData) {
        const expectedParams = createdIds.get(fetchedInvocation.id);
        expect(fetchedInvocation.userId).toEqual(expectedParams?.userId);
        expect(fetchedInvocation.modelParams).toEqual(expectedParams?.modelParams);
        expect(fetchedInvocation.customParams).toEqual(expectedParams?.customParams);      }
    }


    // Test that we're unable to pass in invalid parameters
    const { req, res } = createMocks({
      method: "POST",
      body: {
        name: "invalid name",
        modelParams: { max_tokens: -1000},
        customParams: {},
      },
    });
  
    await createChatParamInvocationHandler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
  
    const failedInvocation = JSON.parse(res._getData());
    expect(failedInvocation.error).toEqual("Invalid Chat Params")
   
  });

});