import { createMocks } from "node-mocks-http";
import createConvoNodesHandler from "../../pages/api/convoNodes/createConvoNode";
import { getAuth } from "@clerk/nextjs/server";

import { ConversationNodeInput } from "../../utils/conversationNode/createConversationNode";
import { initializeTestUser, cleanupTestUser } from "../../utils/testing/testHelper";

jest.mock("@clerk/nextjs/server", () => ({
    ...jest.requireActual("@clerk/nextjs/server"),
    getAuth: jest.fn(),
  }));


describe("Create Conversation Nodes API", () => {
    const TEST_USER_ID = "clerk_test_validate_nodes";
    const TEST_EMAIL = "test+clerk_test_validate_nodes@example.com";
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
    it("rejects duplicate node names", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          },
          {
            role: "AI",
            name: "node1", // Duplicate name
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
    
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
    
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({ 
          error: "Duplicate node names found" 
        });
      });
    
    
      it("rejects invalid role sequence - 2 in a row no options", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          },
          {
            role: "user",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
    
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
    
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({ 
          error: "Invalid role sequence: node1 -> node2: non option nodes that are 2 in a row of same kind" 
        });
      });

      it("rejects invalid role sequence - options with different roles", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options"
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
    
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
    
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({ 
          error: "Invalid role sequence: node1 -> node2: options -> option must be same type" 
        });
      });
          
    
        it("rejects nodes with no start node", async () => {
            const nodes: ConversationNodeInput[] = [
            {
                role: "user",
                name: "node1",
                nextName: "node2",
                isStart: false,
                isEnd: false,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            },
            {
                role: "AI",
                name: "node2",
                isStart: false,
                isEnd: true,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            }
            ];
        
            const { req, res } = createMocks({
            method: "POST",
            body: { nodes },
            });
        
            await createConvoNodesHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData())).toEqual({ 
            error: "No start node found" 
            });
        });
        
        it("rejects nodes with multiple start nodes", async () => {
            const nodes: ConversationNodeInput[] = [
            {
                role: "user",
                name: "node1",
                nextName: "node2",
                isStart: true,
                isEnd: false,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            },
            {
                role: "AI",
                name: "node2",
                isStart: true,
                isEnd: true,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            }
            ];
        
            const { req, res } = createMocks({
            method: "POST",
            body: { nodes },
            });
        
            await createConvoNodesHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData())).toEqual({ 
            error: "Multiple start nodes found" 
            });
        });
        
        it("rejects nodes with no end node", async () => {
            const nodes: ConversationNodeInput[] = [
            {
                role: "user",
                name: "node1",
                nextName: "node2",
                isStart: true,
                isEnd: false,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            },
            {
                role: "AI",
                name: "node2",
                isStart: false,
                isEnd: false,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            }
            ];
        
            const { req, res } = createMocks({
            method: "POST",
            body: { nodes },
            });
        
            await createConvoNodesHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData())).toEqual({ 
            error: "No end node found" 
            });
        });
        
        it("rejects invalid nextName reference", async () => {
            const nodes: ConversationNodeInput[] = [
            {
                role: "user",
                name: "node1",
                nextName: "nonexistent",
                isStart: true,
                isEnd: true,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            }
            ];
        
            const { req, res } = createMocks({
            method: "POST",
            body: { nodes },
            });
        
            await createConvoNodesHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData())).toEqual({ 
            error: "Invalid node nextName: node1 -> nonexistent" 
            });
        });
        
        it("rejects invalid option reference", async () => {
            const nodes: ConversationNodeInput[] = [
            {
                role: "user",
                name: "node1",
                nextName: "node2",
                isStart: true,
                isEnd: false,
                options: ["nonexistent"],
                userId: TEST_USER_ID,
                nodeType: "regular"
            },
            {
                role: "AI",
                name: "node2",
                isStart: false,
                isEnd: true,
                options: [],
                userId: TEST_USER_ID,
                nodeType: "regular"
            }
            ];
        
            const { req, res } = createMocks({
            method: "POST",
            body: { nodes },
            });
        
            await createConvoNodesHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(JSON.parse(res._getData())).toEqual({ 
            error: "Invalid option reference: node1 -> nonexistent" 
            });
        });


      it("accepts valid node configuration", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
    
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
    
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(201);
      });

      it("rejects fallback nodes with invalid fallback references", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "nonexistent"
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        console.log(JSON.parse(res._getData()))
        expect(JSON.parse(res._getData())).toEqual({
          error: "no fallback nonexistent for node node1"
        });
      });
      
      it("rejects fallback nodes that point to user nodes", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            fallbackNodeName: "node3"
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          },
          {
            role: "user",
            name: "node3",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 has invalid fallback node3"
        });
      });
      
      it("rejects user nodes with aiWordForWord set to true", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            aiWordForWord: true
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 of role user but has aiWordForWord"
        });
      });
      
      it("rejects AI nodes with verifySpeech set to true", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            nextName: "node2",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular",
            verifySpeech: true
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node2 of role AI but has verifySpeech"
        });
      });
      
      it("rejects user option nodes with expectedSpeech set", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            isStart: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options",
            expectedSpeech: "Expected speech here"
          },
          {
            role: "user",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 is user options node but has expected speech"
        });
      });
      
      it("rejects user option nodes with no options array", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            isStart: true,
            isEnd: false,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "options"
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 has no options"
        });
      });
      
      it("rejects user option nodes with no traverseNumberOfOptions", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "AI",
            name: "node1",
            isStart: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options",
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 is option node but has no options / traverseNumberOfOptions"
        });
      });    
      
      
      it("rejects user verify nodes with no fallback node", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            isStart: true,
            verifySpeech: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options",
          },
          {
            role: "user",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 is a user verify node with no fallback"
        });
      });   
      
      it("rejects user option nodes with no fallback node", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            isStart: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options",
          },
          {
            role: "user",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 is a user options node with no fallback"
        });
      });       
      it("rejects AI option nodes with traverseNumberOfOptions > options.length", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "AI",
            name: "node1",
            isStart: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options",
            traverseNumberOfOptions: 10
          },
          {
            role: "AI",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 traverse number of options is greater than options length"
        });
      });     
      
      it("rejects user option nodes with traverseNumberOfOptions", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            isStart: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options",
            traverseNumberOfOptions: 10
          },
          {
            role: "user",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 is user node, but has traverseNumberOfOptions"
        });
      });      
      it("rejects user option nodes with nextName", async () => {
        const nodes: ConversationNodeInput[] = [
          {
            role: "user",
            name: "node1",
            isStart: true,
            isEnd: false,
            options: ["node2"],
            userId: TEST_USER_ID,
            nodeType: "options",
            nextName: "node2"
          },
          {
            role: "user",
            name: "node2",
            isStart: false,
            isEnd: true,
            options: [],
            userId: TEST_USER_ID,
            nodeType: "regular"
          }
        ];
      
        const { req, res } = createMocks({
          method: "POST",
          body: { nodes },
        });
      
        await createConvoNodesHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
          error: "node node1 is user option node, but has nextName"
        });
      });            


});