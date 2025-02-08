import { createMocks } from "node-mocks-http";
import { getAuth } from "@clerk/nextjs/server";

import { initializeTestUser, cleanupTestUser } from "../../utils/testing/testHelper";

import { ConversationNodeInput , createConversationNode} from "../../utils/conversationNode/createConversationNode";

import {findNodeByRole} from "../../utils/testing/testHelper";
import createPreMadeChatParamHandler from "../../pages/api/chatParam/preMadeChatParam/createPreMadeChatParam";
import getPreMadeChatParamHandler from "../../pages/api/chatParam/preMadeChatParam/getPreMadeChatParam";
import getPreMadeChatParamsHandler from "../../pages/api/chatParam/preMadeChatParam/getPreMadeChatParams";
import updatePreMadeChatParamHandler from "../../pages/api/chatParam/preMadeChatParam/updatePreMadeChatParam";
import createConvoNodesHandler from "../../pages/api/convoNodes/createConvoNode";

import { defaultModelParams, defaultCustomParams } from "../../utils/chatParamInvokation/chatParamInvokationDefaults";
import generateRandomParams from "../../utils/chatParamInvokation/generateRandomParam";

jest.mock("@clerk/nextjs/server", () => ({
    ...jest.requireActual("@clerk/nextjs/server"),
    getAuth: jest.fn(),
  }));

describe("Test Chat Param Invocation", () => {
  const TEST_USER_ID = "clerk_test_pre_made_chat_param";
  const TEST_EMAIL = "test+clerk_test_pre_made_chat_param@example.com";
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

    const createdIds = new Map<string, Record<string, unknown>>();

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
        
          // Verify node order before creating PreMadeChatParam
        const createdNodes = createConvoNodeResponse.data;

        expect(createdNodes[0].role).toBe("user");
        expect(createdNodes[0].name).toBe("node1");
            
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
    
      // Save merged parameters into createdIds for later validation
      createdIds.set(createdInvocation.id, {
        name: parentParams.name,
        modelParams: mergedModelParams,
        customParams: mergedCustomParams,
        userId: TEST_USER_ID
      });
    }
    // Verify each created preMadeChatParams
    for (const [id, expectedParams] of createdIds.entries()) {
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
        const expectedParams = createdIds.get(fetchedInvocation.id);
        expect(fetchedInvocation.name).toEqual(expectedParams?.name);
        expect(fetchedInvocation.userId).toEqual(expectedParams?.userId);
        expect(fetchedInvocation.modelParams).toEqual(expectedParams?.modelParams);
        expect(fetchedInvocation.customParams).toEqual(expectedParams?.customParams);      }
    }

    // UPDATE ALL PREMADE CHAT PARMS
  
    for (const [id, originalParams] of createdIds.entries()) {
      const updatedParams = {
        id,
        name: `Updated ${id}`,
        modelParams: {
          ...originalParams.modelParams as object,
          system: `system for ${id}`, // Example: Add or update a key-value pair
        },
        customParams: {
          ...originalParams.customParams as object,
          maxTokens: 2000
        }
      };

      const { req, res } = createMocks({
        method: "PUT",
        body: { ...updatedParams },
      });
      await updatePreMadeChatParamHandler(req, res);
      expect(res._getStatusCode()).toBe(200);

      const updatedInvocation = JSON.parse(res._getData());
      expect(updatedInvocation.name).toEqual(updatedParams.name);
      expect(updatedInvocation.modelParams).toEqual(updatedParams.modelParams);
      expect(updatedInvocation.customParams).toEqual(updatedParams.customParams);
      expect(updatedInvocation.id).toEqual(updatedParams.id);
    }


    // CALL GETCHATPARAM AND VERIFY UPDATES
    for (const [id, originalParams] of createdIds.entries()) {
      const { req, res } = createMocks({
        method: "POST",
        body: { id },
      });

      await getPreMadeChatParamHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const fetchedInvocation = JSON.parse(res._getData());
      const expectedParams = {
        name: `Updated ${id}`,
        modelParams: {
          ...originalParams.modelParams as object,
          system: `system for ${id}`, // Example: Add or update a key-value pair
        },
        customParams: {
          ...originalParams.customParams as object,
          maxTokens: 2000
        }
      };
      expect(fetchedInvocation.name).toEqual(expectedParams.name);
      expect(fetchedInvocation.modelParams).toEqual(expectedParams.modelParams);
      expect(fetchedInvocation.customParams).toEqual(expectedParams.customParams);
    }

    // FETCH ALL PREMADECHAT PARAMS, ENSURE THEY ARE HE SAME
    {
      const { req, res } = createMocks({
        method: "GET",
      });
    
      await getPreMadeChatParamsHandler(req, res);
    
      expect(res._getStatusCode()).toBe(200);
    
      const fetchedList = JSON.parse(res._getData());
    
      // Ensure the length of the fetched list matches the number of created entries
      expect(fetchedList).toHaveLength(createdIds.size);
      for (const fetchedParam of fetchedList) {
      
        const id = fetchedParam.id

        const expectedModelParams = createdIds.get(id)?.modelParams
        const expectedCustomParams = createdIds.get(id)?.customParams

        // Verify that the fetched modelParams match the updated modelParams
        const expectedParams = {
          name: `Updated ${id}`,
          modelParams: {
            ...expectedModelParams as object,
            system: `system for ${fetchedParam.id}`, // Example: Add or update a key-value pair
          },
          customParams: {
            ...expectedCustomParams as object,
            maxTokens: 2000
          }
        };
    
        expect(fetchedParam.name).toEqual(expectedParams.name);
        expect(fetchedParam.modelParams).toEqual(expectedParams.modelParams);
        expect(fetchedParam.customParams).toEqual(expectedParams.customParams);        
      }
    }

    {
      // CHECK THAT WE CANNOT CREATE INVALID PREMADECHATPARAMS
      const { req, res } = createMocks({
        method: "POST",
        body: {
          name: "Name goes here",
          modelParams: {},
          customParams: { attitude: "NOT AN ATTITUDE"},
        },
      });
    
      await createPreMadeChatParamHandler(req, res);
    
      expect(res._getStatusCode()).toBe(400);
    
      const failedInvocation = JSON.parse(res._getData());
      expect(failedInvocation.error).toEqual("Invalid Chat Params")
    }


    // CHECK THAT WE CANNOT UPDATE INVALID PREMADECHATPARAMS
    {
        const { req, res } = createMocks({
        method: "PUT",
        body: {
          id: createdIds.keys().next().value,
          name: "Name goes here",
          modelParams: {top_p: 100},
          customParams: { },
        },
      });
    
      await updatePreMadeChatParamHandler(req, res);
    
      expect(res._getStatusCode()).toBe(400);
    
      const failedUpdateInvocation = JSON.parse(res._getData());
      expect(failedUpdateInvocation.error).toEqual("Invalid Chat Params")  
    }

  });


});