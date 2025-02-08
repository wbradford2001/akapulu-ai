import { validateTraversal } from "../../../utils/testing/traverseValidation";
import { ConversationNode } from '@prisma/client';

import { createConversationNode } from "../../../utils/conversationNode/createConversationNode";



const TEST_USER_ID = "testTraversalOptions2"
describe('validateTraversal with limited options', () => {
  const nodeDict: Record<string, Omit<ConversationNode, 'id' | 'createdAt' | 'updatedAt'>> = {
    nodeWithOptions: createConversationNode({
      role: 'user',
      options: ['option1', 'option2', 'option3', 'option4'],
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
      expectedSpeech: 'Option 1 speech',


      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "option1",         
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
    option3: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Option 3 speech',


      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "option3",    
      nodeType: "regular",               

    }),
    option4: createConversationNode({
      role: 'AI',
      expectedSpeech: 'Option 4 speech',

      isEnd: false,
      isStart: false,
      nextName: null,
      options: [],
      traverseNumberOfOptions: null,
      userId: TEST_USER_ID,
      name: "option4",        
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

  test('Successful traversal visiting the required number of options', () => {
    const traversal = ['nodeWithOptions', 'option1', 'option2', 'nodeAfterOptions', 'nodeEnd'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({ isValid: true });
  });

  test('Unsuccessful traversal visiting fewer than required options', () => {
    const traversal = ['nodeWithOptions', 'option1', 'nodeAfterOptions', 'nodeEnd'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Invalid option: node nodeAfterOptions is not a valid option for node nodeWithOptions.',
    });
  });

  test('Unsuccessful traversal with invalid option', () => {
    const traversal = ['nodeWithOptions', 'invalidOption', 'option2', 'nodeAfterOptions', 'nodeEnd'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Invalid option: node invalidOption is not a valid option for node nodeWithOptions.',
    });
  });

  test('Unsuccessful traversal skipping nextName after options', () => {
    const traversal = ['nodeWithOptions', 'option1', 'option2', 'nodeEnd'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal does not correctly follow "nextName" for node nodeWithOptions.',
    });
  });

  test('Unsuccessful traversal continuing after end node', () => {
    const traversal = ['nodeWithOptions', 'option1', 'option2', 'nodeAfterOptions', 'nodeEnd', 'nodeWithOptions'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal continues after the end node nodeEnd.',
    });
  });

  test('Successful traversal with different valid options', () => {
    const traversal = ['nodeWithOptions', 'option3', 'option4', 'nodeAfterOptions', 'nodeEnd'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({ isValid: true });
  });

  test('Unsuccessful traversal visiting more options than required', () => {
    const traversal = ['nodeWithOptions', 'option1', 'option2', 'option3', 'nodeAfterOptions', 'nodeEnd'];
    const result = validateTraversal({traversal, nodeDict});
    expect(result).toEqual({
      isValid: false,
      error: 'Traversal does not correctly follow \"nextName\" for node nodeWithOptions.',
    });
  });
});