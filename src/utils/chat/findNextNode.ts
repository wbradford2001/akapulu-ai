import { ConversationNode } from "@prisma/client"

// picks an option from an options array
export function pickOption(
    currentNode: string, // current node to pick from
    scriptJson: Record<string, ConversationNode> // script
  ): {
    nextNode: string,// option picked
    updatedScript: Record<string, ConversationNode> // modified script
  }{
    const currentNodeData: ConversationNode = scriptJson[currentNode]
  
    // check we've got an options node
    if (currentNodeData.nodeType !== "options"){
      throw new Error(`can pick option of regular node for ${currentNodeData}`)
    }

    // if we've got no more traverseNumberOfOptions
    if (currentNodeData.traverseNumberOfOptions == 0 || 
      currentNodeData.traverseNumberOfOptions == undefined ||
      currentNodeData.traverseNumberOfOptions == null
    ){
      throw new Error(`no traverseNumberOfOptions for ${currentNodeData}`)
    }
  
    
    // pick next option
    const randomIndex = Math.floor(Math.random() * currentNodeData.options.length);
    const nextOption = currentNodeData.options[randomIndex]
    
    // update script
    const updatedScript: Record<string, ConversationNode> = { ...scriptJson };

    // update options array
    if (!updatedScript[currentNode]){
      throw new Error(`currentNode ${currentNode} not in updated script`)
    }
    updatedScript[currentNode].options = [
      ...currentNodeData.options.slice(0, randomIndex),
      ...currentNodeData.options.slice(randomIndex + 1),
    ];
      
        // update traverserNmberOfOptions
      const node = updatedScript[currentNode];
      if (!node) {
        throw new Error(`Node with name ${currentNode} not found in updatedScript`);
      }
      
      // note - this only executes for AI option nodes, we don't call this for user option nodes
      if (typeof node.traverseNumberOfOptions === 'number') {
          node.traverseNumberOfOptions -= 1;
      } else {
        throw new Error(`Invalid or missing traverseNumberOfOptions for node ${currentNode}`);
      }
    return { nextNode: nextOption, updatedScript };
  
  }
  

  // given current user or ai node, find the next node
export function findNextNode(
    currentNode: string, // can be user or AI node
    scriptJson: Record<string, ConversationNode>,
    stack: string[],
  ): { 
    nextNode: string | null; 
    updatedScriptJson: Record<string, ConversationNode>,
    updatedStack: string[]
  } {
  
    const currentNodeData: ConversationNode = scriptJson[currentNode]
  
    // if we recieve a user option node as next, that means we got it from the stack
    if (currentNodeData.nodeType == "options" && currentNodeData.role == "user"){

      // if (currentNodeData.traverseNumberOfOptions && currentNodeData.traverseNumberOfOptions > 0){
      //   // we just return it if there are more nodes to traverse
        // return {nextNode: currentNode, updatedScriptJson: scriptJson, updatedStack: stack}
      // }

      // if no more options, continue on
    }
  
    // if ai option node
    if (currentNodeData.nodeType === "options" && currentNodeData.role === "AI"){
      if (currentNodeData.options && currentNodeData.options.length > 0) {
        // throw error if no traverseNumberOfOptions
        if (currentNodeData.traverseNumberOfOptions == null){
          throw new Error("options array has length, no traverseNumberOfOptions")
        }
      
        if (currentNodeData.traverseNumberOfOptions > 0){
          // we decrement the travereNumbeOfOptions in run traverse handler
          // pick next option (pops from stack if no more options left)
          const {updatedScript, nextNode} = pickOption(currentNode, scriptJson)
          
          
          // push AI node to stack
          stack.push(currentNode)
          return {nextNode, updatedScriptJson: updatedScript, updatedStack: stack}
        }
      }
    }
  
    // If no options, use the next field
    if (currentNodeData.nextName) {
      return {
        nextNode: currentNodeData.nextName, 
        updatedScriptJson: scriptJson,
        updatedStack: stack
       };
    }
  
    // continuously check if there's an option node in the stack with traverseNumberOfOptions > 0
    if (stack.length > 0){
      const stackNode: string  | undefined= stack.pop()
      if (stackNode == undefined){
        throw new Error("StackNode is undefined")
      }
      return findNextNode(stackNode, scriptJson, stack)
    }
  
    // No next node, end the conversation
    return { nextNode: null, updatedScriptJson: scriptJson, updatedStack: stack};
  }