import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma"; // Adjust the path to your Prisma client
import { getAuth } from "@clerk/nextjs/server";

import { ConversationNodeInput, createConversationNode } from "../../../utils/conversationNode/createConversationNode";

export default async function createConvoNodesHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { nodes } = req.body as { nodes: ConversationNodeInput[] };
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ error: "Invalid or empty nodes array" });
  }

  try {
      let nodesToProcess = [...nodes];

      // If first node is AI, insert initial user node
      if (nodes[0]?.role === "AI") {
        const initialUserNode: ConversationNodeInput = {
          role: "user",
          expectedSpeech: "Hello",
          nextName: nodes[0].name,
          isStart: true,
          isEnd: false,
          options: [],
          ignoreInTranscript: true,
          traverseNumberOfOptions: null,
          userId,
          name: "initial_user_node",
          nodeType: "regular"
        };
        
        // Update original first node to not be start
        nodesToProcess[0] = {
          ...nodesToProcess[0],
          isStart: false
        };
        
        // Add initial node at beginning
        nodesToProcess = [initialUserNode, ...nodesToProcess];
      }

    // Validate the nodes array
    const {error, message} = validateNodes(nodesToProcess);
    if (error) {
      console.log(message)
      return res.status(400).json({ error: message });
    }
    const updatedNodes = nodesToProcess.map((node) =>
      createConversationNode({
        ...node,
      })
    );

    // Create nodes in parallel and collect results
    const createdNodes = await Promise.all(
      updatedNodes.map(node => 
        prisma.conversationNode.create({
          data: node
        })
      )
    );

    res.status(201).json({ 
      message: `Successfully created ${createdNodes.length} conversation nodes`, 
      data: createdNodes 
    });
  } catch (error) {
    console.error("Error creating conversation nodes:", error);
    res.status(500).json({ error: "Failed to create conversation nodes" });
  }
}

type ValidationResult = {
  error: boolean;
  message?: string;
}

function validateNodes(nodes: ConversationNodeInput[]): ValidationResult {
  // Check for duplicate names
  const names = nodes.map(node => node.name);
  if (new Set(names).size !== names.length) {
    return { error: true, message: "Duplicate node names found" };
  }

  // Create node map for reference
  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.name] = node;
    return acc;
  }, {} as Record<string, ConversationNodeInput>);

  // Check start nodes
  const startNodes = nodes.filter(node => node.isStart);
  if (startNodes.length === 0) {
    return { error: true, message: "No start node found" };
  }
  if (startNodes.length > 1) {
    return { error: true, message: "Multiple start nodes found" };
  }
  if (startNodes[0].role === "AI") {
    return { error: true, message: "Start node cannot be an AI node" };
  }

  // Check end nodes
  const endNodes = nodes.filter(node => node.isEnd);
  if (endNodes.length === 0) {
    return { error: true, message: "No end node found" };
  }

  // Check role sequences
  for (const node of nodes) {
      // name
      if (node.name == ""){
        return {error: true, message: `node has to have a name`}
      }

    if (node.nextName) {
      if (!nodeMap[node.nextName]){
        return { error: true, message: `Invalid node nextName: ${node.name} -> ${node.nextName}`};
      }

      // two nodes in a row of same type
      const nextNode = nodeMap[node.nextName];
      if (node.role === nextNode.role && node.nodeType !== "options") {
          return { error: true, message: `Invalid role sequence: ${node.name} -> ${node.nextName}: non option nodes that are 2 in a row of same kind` };
      }

    }

    // Validate options exist
    if (node.options && node.options.length > 0) {
      for (const optionName of node.options) {
        if (!nodeMap[optionName]) {
          return { error: true, message: `Invalid option reference: ${node.name} -> ${optionName}` };
        }
        if (node.role !==nodeMap[optionName].role){
          return { error: true, message: `Invalid role sequence: ${node.name} -> ${node.nextName}: options -> option must be same type` };
        }
      }
    }

    // user node can't have traverse number of options
    if (node.traverseNumberOfOptions && node.role === "user"){
      return {error: true, message: `node ${node.name} is user node, but has traverseNumberOfOptions`}
    }    

    // user node can't have nextName
    if (node.role === "user" && node.nodeType === "options" && node.nextName != null){
      return {error: true, message: `node ${node.name} is user option node, but has nextName`}
    }        

    // check that fallback node exists
    if (node.fallbackNodeName){
      if (node.role === "AI"){
        return { error: true, message: `AI node ${node.name} cannot have fallback`};
      }   
      if (!nodeMap[node.fallbackNodeName]){
        return { error: true, message: `no fallback ${node.fallbackNodeName} for node ${node.name}`};
      } 
      const fallBackNodeData = nodes.find(
        (n)=>{
          return n.name === node.fallbackNodeName
        })

      // can't have user fallback nodes
      if (!fallBackNodeData || fallBackNodeData.role === "user"){
        return {error: true, message: `node ${node.name} has invalid fallback ${node.fallbackNodeName}`}
      }    
      
      // user node can't have traverse number of options
      if (node.traverseNumberOfOptions){
        return {error: true, message: `node ${node.name} is user node, but has traverseNumberOfOptions`}
      }      
        
    }

    // check end
    if (node.isEnd && node.nextName){
      return {error: true, message: `node ${node.name} cannot be end and have next name`}
    }


  }



  // NOTE TYPE SPECIFIC VALIDATION
  for (const node of nodes){


    // regular & fallback
    if (node.nodeType === "regular" || node.nodeType === "fallback"){

      // user nodes
      if (node.role === "user"){
        if (node.aiWordForWord){
          return {error: true, message: `node ${node.name} of role user but has aiWordForWord`}
        }
        if (node.verifySpeech && !node.expectedSpeech){
          return {error: true, message: `node ${node.name} has verify speech but no expected speech`}
        }        
      }

      // ai nodes
      if (node.role === "AI"){
        if (node.verifySpeech){
          return {error: true, message: `node ${node.name} of role AI but has verifySpeech`}
        }
        if (node.aiWordForWord && !node.expectedSpeech){
          return {error: true, message: `node ${node.name} is word for word but has no expected speech`}
        }       
        if (node.aiWordForWord && !node.expectedSpeech){
          return {error: true, message: `node ${node.name} is word for word but has no expected speech`}
        }              
      }

    } else if (node.nodeType === "options"){

      // user nodes
      if (node.role === "user"){
        if (node.expectedSpeech){
          return {error: true, message: `node ${node.name} is user options node but has expected speech`}
        }
        if (!node.options || node.options == undefined || node.options.length == 0){
          return {error: true, message: `node ${node.name} has no options`}
        }     
        if (!node.options || node.options == undefined || node.options.length == 0){
          return {error: true, message: `node ${node.name} has no options`}
        }          
      }
      // ai nodes
      // TODO
    }
  }

  // options node
  for (const node of nodes){
    if (node.role === "user" && node.verifySpeech){
      if (!node.fallbackNodeName){
        return {error: true, message: `node ${node.name} is a user verify node with no fallback`}

      }
    }  
    if (node.role === "user" && node.nodeType === "options"){
      if (!node.fallbackNodeName){
        return {error: true, message: `node ${node.name} is a user options node with no fallback`}

      }
    }        
    if (node.nodeType === "options" && node.role === "AI"){
      if (!node.traverseNumberOfOptions || !node.options){
        return {error: true, message: `node ${node.name} is option node but has no options / traverseNumberOfOptions`}

      }
      if (node.traverseNumberOfOptions> node.options.length && node.traverseNumberOfOptions != Infinity){
        return {error: true, message: `node ${node.name} traverse number of options is greater than options length`}
      }
    }


  }

  return { error: false };
}