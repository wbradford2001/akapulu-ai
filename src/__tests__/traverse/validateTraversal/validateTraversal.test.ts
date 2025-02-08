import { validateTraversal } from "../../../utils/testing/traverseValidation";
import { ConversationNode } from '@prisma/client';


import { createConversationNode } from "../../../utils/conversationNode/createConversationNode";

const TEST_USER_ID = "testTraversalRegular"

describe('validateTraversal no options', () => {
  const nodeDict: Record<string,  Omit<ConversationNode, 'id' | 'createdAt' | 'updatedAt'> > = {
    node1: createConversationNode({
      role: 'user',
      expectedSpeech: 'Start node speech',
      nextName: 'node2',
      isStart: true,

      isEnd: false,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      nodeType: "regular",
      name: "node1",
    }),
    node2: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Middle node speech',
      nextName: 'node3',

      isStart: false,
      isEnd: false,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "node2",      
      nodeType: "regular",

    }),
    node3: createConversationNode({
      role: 'user',
      expectedSpeech: 'End node speech',
      isStart: false,


      isEnd: true,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "node3",        
      nodeType: "regular",

    }),
  };
  const nodeDictImproperEnding: Record<string,  Omit<ConversationNode, 'id' | 'createdAt' | 'updatedAt'>> = {
    node1: createConversationNode({
      role: 'user',
      expectedSpeech: 'Start node speech',
      nextName: 'node2',
      isStart: true,

      isEnd: false,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "node1",        
      nodeType: "regular",      
    }),
    node2: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Middle node speech',
      nextName: 'node3',

      isEnd: false,
      isStart: false,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "node2",      
      nodeType: "regular",        
    }),
    node3: createConversationNode({
      role: 'user',
      expectedSpeech: 'End node speech',

      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "node3",     
      nodeType: "regular",        
    }),
  };

  test('Successful traversal without options', () => {
    const traversal = ['node1', 'node2', 'node3'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({ isValid: true });
  });

  test('Unsuccessful traversal missing start node', () => {
    const traversal = ['node2', 'node3'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal does not start at the correct start node.',
    });
  });

  test('Unsuccessful traversal skipping a node', () => {
    const traversal = ['node1', 'node3'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal does not correctly follow "nextName" for node node1.',
    });
  });

  test('Unsuccessful traversal ending prematurely', () => {
    const traversal = ['node1', 'node2', 'node3'];
    const result = validateTraversal({traversal, nodeDict:nodeDictImproperEnding});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal ended prematurely.',
    });
  });

  test('Unsuccessful traversal continuing after end node', () => {
    const traversal = ['node1', 'node2', 'node3', 'node1'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal continues after the end node node3.',
    });
  });

});