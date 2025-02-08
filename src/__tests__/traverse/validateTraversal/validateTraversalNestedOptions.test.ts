import { validateTraversal } from "../../../utils/testing/traverseValidation";
import { ConversationNode } from '@prisma/client';


import { createConversationNode } from "../../../utils/conversationNode/createConversationNode";


const TEST_USER_ID = "traversalNestedOptions"
describe('validateTraversal with nested options', () => {
  const nodeDict: Record<string, Omit<ConversationNode, 'id' | 'createdAt' | 'updatedAt'>> = {
    nodeWithOptions: createConversationNode({
      role: 'user',
      options: ['option1', 'option2'],
      traverseNumberOfOptions: 2,
      isStart: true,
      nextName: 'nodeAfterOptions',

      isEnd: false,
      userId: TEST_USER_ID,
      name: "nodeWithOptions",    
      nodeType: "options",         
    }),
    option1: createConversationNode({
      role: 'AI',
      options: ['nestedOption1', 'nestedOption2'],
      traverseNumberOfOptions: 2,
      nextName: 'option1Next',

      isEnd: false,
      isStart: false,
      userId: TEST_USER_ID,
      name: "option1",     
      nodeType: "options",        
    }),
    nestedOption1: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Nested Option 1 speech',

      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "nestedOption1",    
      nodeType: "regular",         
    }),
    nestedOption2: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Nested Option 2 speech',

      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "nestedOption2",
      nodeType: "regular",          
    }),
    option1Next: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Option 1 Next speech',

      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "option1Next",     
      nodeType: "regular",          
    }),
    option2: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Option 2 speech',

      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "option2",        
      nodeType: "regular",      
    }),
    nodeAfterOptions: createConversationNode({
      role: 'user',
      expectedSpeech: 'After options speech',
      nextName: 'nodeEnd',

      isEnd: false,
      isStart: false,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "nodeAfterOptions",    
      nodeType: "regular",          
    }),
    nodeEnd: createConversationNode({
      role: 'AI',
      expectedSpeech: 'End node speech',
      isEnd: true,

      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "nodeEnd",  
      nodeType: "regular",            
    }),
  };

  test('Successful traversal with nested options', () => {
    const traversal = [
      'nodeWithOptions',
      'option1',
      'nestedOption1',
      'nestedOption2',
      'option1Next',
      'option2',
      'nodeAfterOptions',
      'nodeEnd',
    ];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({ isValid: true });
  });

  test('Unsuccessful traversal missing a nested option', () => {
    const traversal = [
      'nodeWithOptions',
      'option1',
      'nestedOption1',
      'option1Next',
      'option2',
      'nodeAfterOptions',
      'nodeEnd',
    ];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Invalid option: node option1Next is not a valid option for node option1.',
    });
  });

  test('Unsuccessful traversal with invalid nested option', () => {
    const traversal = [
      'nodeWithOptions',
      'option1',
      'invalidNestedOption',
      'nestedOption2',
      'option1Next',
      'option2',
      'nodeAfterOptions',
      'nodeEnd',
    ];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Invalid option: node invalidNestedOption is not a valid option for node option1.',
    });
  });

  test('Unsuccessful traversal skipping nextName after nested options', () => {
    const traversal = [
      'nodeWithOptions',
      'option1',
      'nestedOption1',
      'nestedOption2',
      'option2',
      'nodeAfterOptions',
      'nodeEnd',
    ];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal does not correctly follow "nextName" for node option1.',
    });
  });

  test('Unsuccessful traversal missing an outer option', () => {
    const traversal = [
      'nodeWithOptions',
      'option1',
      'nestedOption1',
      'nestedOption2',
      'option1Next',
      'nodeAfterOptions',
      'nodeEnd',
    ];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Invalid option: node nodeAfterOptions is not a valid option for node nodeWithOptions.',
    });
  });

  test('Unsuccessful traversal continuing after end node', () => {
    const traversal = [
      'nodeWithOptions',
      'option1',
      'nestedOption1',
      'nestedOption2',
      'option1Next',
      'option2',
      'nodeAfterOptions',
      'nodeEnd',
      'nodeWithOptions',
    ];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal continues after the end node nodeEnd.',
    });
  });
});