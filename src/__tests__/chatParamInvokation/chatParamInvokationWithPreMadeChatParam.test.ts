import { createMocks } from "node-mocks-http";
import { getAuth } from "@clerk/nextjs/server";

import { initializeTestUser, cleanupTestUser } from "../../utils/testing/testHelper";

import {createConversationNode, ConversationNodeInput} from "../../utils/conversationNode/createConversationNode";

import createPreMadeChatParamHandler from "../../pages/api/chatParam/preMadeChatParam/createPreMadeChatParam";
import getPreMadeChatParamHandler from "../../pages/api/chatParam/preMadeChatParam/getPreMadeChatParam";
import getPreMadeChatParamsHandler from "../../pages/api/chatParam/preMadeChatParam/getPreMadeChatParams";
import createConvoNodesHandler from "../../pages/api/convoNodes/createConvoNode";
import {findNodeByRole} from "../../utils/testing/testHelper"

import createChatParamInvocationHandler from "../../pages/api/chatParam/chatParamInvokation/createChatParamInvokation";
import getChatParamInvokationsHandler from "../../pages/api/chatParam/chatParamInvokation/getChatParamInvokations";
import getChatParamInvokationHandler from "../../pages/api/chatParam/chatParamInvokation/getChatParamInvokation";
import { defaultModelParams, defaultCustomParams } from "../../utils/chatParamInvokation/chatParamInvokationDefaults";
import generateRandomParams from "../../utils/chatParamInvokation/generateRandomParam";

jest.mock("@clerk/nextjs/server", () => ({
    ...jest.requireActual("@clerk/nextjs/server"),
    getAuth: jest.fn(),
  }));

describe("Test Chat Param Invocation", () => {
  const TEST_USER_ID = "clerk_test_chat_param_invokation_with_pre_made_chat_param";
  const TEST_EMAIL = "test+clerk_test_chat_param_invokation_with_pre_made_chat_param@example.com";
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

  it("Creates and retrieves multiple preMadeChatParamInputs", async () => {

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
        const preMadeChatParamInputs= [
          // Test case 1: Generate random values
          { name: "name1", 
            modelParams: {...generateRandomParams(defaultModelParams)}, 
            customParams:  {...generateRandomParams(defaultCustomParams)},
            conversationNodes: conversationNodes.map((node) => {
              return createConversationNode({
                ...node,
              })
            })
          },
          // Test case 2
          {name: "name2", 
            modelParams: {...generateRandomParams(defaultModelParams)}, 
            customParams:  {...generateRandomParams(defaultCustomParams)},
            conversationNodes: conversationNodes.map((node) => {
              return createConversationNode({
                ...node,
              })
            })
          },
          // Test case 3
          { name: "name3", 
            conversationNodes: conversationNodes.map((node) => {
              return createConversationNode({
                ...node,
              })
            })
          },
        ];
    {
      const { req, res } = createMocks({
        method: "GET",
      });

      await getPreMadeChatParamsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const initialData = JSON.parse(res._getData());
      expect(initialData).toEqual([]);
    }

    const createdChatParamIds = new Map<string, Record<string, unknown>>();

    for (const parentParams of preMadeChatParamInputs) {
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

        // Create the conversation nodes
        const createNodesRequest = createMocks({
          method: "POST",
          body: { nodes: parentParams.conversationNodes },
        });
        await createConvoNodesHandler(createNodesRequest.req, createNodesRequest.res);
    
        // Assert that the handler successfully created the nodes
        expect(createNodesRequest.res._getStatusCode()).toBe(201);
        const createConvoNodeResponse = JSON.parse(createNodesRequest.res._getData())
        expect(createConvoNodeResponse.message).toEqual(
          `Successfully created ${createConvoNodeResponse.data.length} conversation nodes`);
                  
      const { req, res } = createMocks({
        method: "POST",
        body: {
          name: parentParams.name,
          modelParams: mergedModelParams,
          customParams: mergedCustomParams,
          conversationNodes: createConvoNodeResponse.data
        },
      });
    
      await createPreMadeChatParamHandler(req, res);
    
      expect(res._getStatusCode()).toBe(201);
    
      const createdInvocation = JSON.parse(res._getData());
    
      // Save merged parameters into createdChatParamIds for later validation
      createdChatParamIds.set(createdInvocation.id, {
        name: parentParams.name,
        modelParams: mergedModelParams,
        customParams: mergedCustomParams,
        userId: TEST_USER_ID
      });
    }
    // Verify each created preMadeChatParams
    for (const [id, expectedParams] of createdChatParamIds.entries()) {
      const { req, res } = createMocks({
        method: "POST",
        body: { id }
      });

      await getPreMadeChatParamHandler(req, res);


      expect(res._getStatusCode()).toBe(200);

      const fetchedInvocation = JSON.parse(res._getData());

      expect(fetchedInvocation.name).toEqual(expectedParams.name);
      expect(fetchedInvocation.userId).toEqual(expectedParams.userId);
      expect(fetchedInvocation.modelParams).toEqual(expectedParams.modelParams);
      expect(fetchedInvocation.customParams).toEqual(expectedParams.customParams);
    }


    // Verify all preMadeChatParams
    {
      const { req, res } = createMocks({
        method: "GET",
      });

      await getPreMadeChatParamsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const fetchedData = JSON.parse(res._getData());

      expect(fetchedData).toHaveLength(preMadeChatParamInputs.length);
      for (const fetchedInvocation of fetchedData) {
        const expectedParams = createdChatParamIds.get(fetchedInvocation.id);
        expect(fetchedInvocation.name).toEqual(expectedParams?.name);
        expect(fetchedInvocation.userId).toEqual(expectedParams?.userId);
        expect(fetchedInvocation.modelParams).toEqual(expectedParams?.modelParams);
        expect(fetchedInvocation.customParams).toEqual(expectedParams?.customParams);      }
    }

    // NOW GENERATE CHAT PARAM INVOKATIONS
    const chatParamInvokations= [
      // Test case 1: Generate random values
      { name: "name1", modelParams: {...generateRandomParams(defaultModelParams)}, customParams:  {...generateRandomParams(defaultCustomParams)}},
      // Test case 2: Generate random values
      {name: "name2", modelParams: {...generateRandomParams(defaultModelParams)}, customParams:  {...generateRandomParams(defaultCustomParams)}},
      // Test case 3: Use default values
      { name: "name3", },
    ];

    let i = 0
    const createdChatInvokation: string[] = []
    for (const id of createdChatParamIds.keys()) {

        const { req, res } = createMocks({
        method: "POST",
        body: {
            preMadeChatParamId: id,
            modelParams: chatParamInvokations[i].modelParams,
            customParams: chatParamInvokations[i].customParams,
        },
        });

        await createChatParamInvocationHandler(req, res);

        expect(res._getStatusCode()).toBe(201);
        createdChatInvokation.push(JSON.parse(res._getData()).id)
        i += 1
      }

    // VERIFY ALL CHAT PARAM INVOKATIONS
        {
            const { req, res } = createMocks({
                method: "GET",
            });

            await getChatParamInvokationsHandler(req, res);

            expect(res._getStatusCode()).toBe(200);
            const fetchedData = JSON.parse(res._getData());

            expect(fetchedData).toHaveLength(chatParamInvokations.length);
            for (const fetchedInvocation of fetchedData) {
                const expectedParams = createdChatParamIds.get(fetchedInvocation.preMadeChatParamId);
                expect(fetchedInvocation.userId).toEqual(expectedParams?.userId);
                expect(fetchedInvocation.modelParams).toEqual(expectedParams?.modelParams);
                expect(fetchedInvocation.customParams).toEqual(expectedParams?.customParams);  

          
               }
        }


        // VERIFY CONVERSATION NODES
        {
          const { req, res } = createMocks({
              method: "POST",
              body: { id: createdChatInvokation[0] }
          });

          await getChatParamInvokationHandler(req, res);

          expect(res._getStatusCode()).toBe(200);
          const fetchedInvocation = JSON.parse(res._getData());

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
  });

});