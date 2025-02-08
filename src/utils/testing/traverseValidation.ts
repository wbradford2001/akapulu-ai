import { TranscriptRow,ConversationNode } from "@prisma/client";


function arraysAreEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
    return arr1.every((val, index) => val === arr2[index]);
  }
  
  export function transcriptsAreEqual(
    transcriptA: TranscriptRow[],
    transcriptB: TranscriptRow[],
  ): boolean {
    if (transcriptA.length !== transcriptB.length) {
      console.log(
        "Transcripts are not equal in length",
        transcriptA,
        transcriptB,
      );
      return false;
    }
  
    for (let i = 0; i < transcriptA.length; i++) {
      const rowA = transcriptA[i];
      const rowB = transcriptB[i];
      if (rowA.role !== rowB.role || rowA.content !== rowB.content) {
        console.log("Transcripts are not equal")
        console.log(rowA.role, rowB.role);
        console.log(rowA.content, rowB.content)
        return false;
      }
    }
  
    return true;
  }
  
  export interface ValidateTraversalInput {
    traversal?: string[];
    nodeDict?: Record<
      string,
      Omit<ConversationNode, "id" | "createdAt" | "updatedAt">
    >;
    traversalsToMatch?: string[][] | null;
    transcriptsToMatch?: TranscriptRow[][] | null;
    transcript?: TranscriptRow[];
  }
  
  interface ValidationResult {
    isValid: boolean;
    error?: string;
  }
  export function validateTraversal({
    traversal, // list of node names visited
    nodeDict, // map of node names to node values
    traversalsToMatch, // array of traversals to match
    transcriptsToMatch, // array of transcripts to match
    transcript, // the transcript of the conversation
  }: ValidateTraversalInput): ValidationResult {
    // first, if we are given a traversal(s) to Match, we want to check if it matches any traversal
    if (traversalsToMatch != undefined) {
      if (!traversal) {
        return {
          isValid: false,
          error: "Mismatch between traversals to match and traversals",
        };
      }
      for (const traversalToMatch of traversalsToMatch) {
        // Compare the contents, not just references
        if (arraysAreEqual(traversalToMatch, traversal)) {
          return { isValid: true };
        }
      }
      return {
        isValid: false,
        error: "Traversal does not match any traversalToMatch",
      };
    }
  
    // if we recieve transcriptsToMatch
    if (transcriptsToMatch != undefined || transcript != undefined) {
      if (!(transcriptsToMatch && transcript)) {
        throw new Error("no transcriptsToMatch/transcript pair!");
      }
      for (const transcriptToMatch of transcriptsToMatch) {
        // Compare the contents, not just references
        if (transcriptsAreEqual(transcriptToMatch, transcript)) {
          return { isValid: true };
        }
      }
      return {
        isValid: false,
        error: "Transcript does not match any transcriptsToMatch",
      };
    }
  
    // otherwise, validate traversal
    let pointer = 0; // Pointer to track position in traversal
  
    if (!traversal || !nodeDict) {
      return { isValid: false, error: "No traversal or nodeDict detected" };
    }
  
    function traverseNode(
      traversal: string[],
      nodeDict: Record<
        string,
        Omit<ConversationNode, "id" | "createdAt" | "updatedAt">
      >,
      nodeId: string,
    ): ValidationResult {
      if (pointer >= traversal.length) {
        return { isValid: false, error: "Traversal ended prematurely." };
      }
  
      const currentNode = nodeDict[nodeId];
      if (!currentNode) {
        return {
          isValid: false,
          error: `Node ID ${nodeId} not found in the dictionary.`,
        };
      }
  
      const currentTraversalId = traversal[pointer];
      if (currentTraversalId !== nodeId) {
        return {
          isValid: false,
          error: `Traversal mismatch: expected node ${nodeId}, but found ${currentTraversalId}.`,
        };
      }
  
      pointer++; // Move pointer to the next node in traversal
  
      // Handle options
      if (
        currentNode.options &&
        currentNode.traverseNumberOfOptions !== undefined
      ) {
        let optionsRemaining = currentNode.traverseNumberOfOptions;
  
        while (optionsRemaining && optionsRemaining > 0) {
          if (pointer >= traversal.length) {
            return {
              isValid: false,
              error: `Traversal ended before visiting all options for node ${nodeId}.`,
            };
          }
  
          const nextOptionName = traversal[pointer];
          if (!currentNode.options.includes(nextOptionName)) {
            return {
              isValid: false,
              error: `Invalid option: node ${nextOptionName} is not a valid option for node ${nodeId}.`,
            };
          }
  
          // Traverse the option node
          const optionValidation = traverseNode(
            traversal,
            nodeDict,
            nextOptionName,
          );
          if (!optionValidation.isValid) {
            return optionValidation;
          }
  
          optionsRemaining--;
        }
      }
  
      // Move to the nextName node
      if (currentNode.nextName) {
        if (
          pointer >= traversal.length ||
          traversal[pointer] !== currentNode.nextName
        ) {
          return {
            isValid: false,
            error: `Traversal does not correctly follow "nextName" for node ${nodeId}.`,
          };
        }
        return traverseNode(traversal, nodeDict, currentNode.nextName);
      }
  
      // Handle end node
      if (currentNode.isEnd) {
        if (pointer !== traversal.length) {
          return {
            isValid: false,
            error: `Traversal continues after the end node ${nodeId}.`,
          };
        }
        return { isValid: true }; // Valid traversal
      }
      if (!currentNode.isEnd && pointer >= traversal.length) {
        return { isValid: false, error: `Traversal ended prematurely.` };
      }
  
      if (!currentNode.nextName) {
        return { isValid: true };
      }
  
      return { isValid: false, error: `Unexpected case at node ${nodeId}.` };
    }
  
    // Find the start node
    const startNode = Object.values(nodeDict).find((node) => node.isStart);
    if (!startNode) {
      return {
        isValid: false,
        error: "No start node found in the node dictionary.",
      };
    }
    if (traversal[0] !== startNode.name) {
      return {
        isValid: false,
        error: "Traversal does not start at the correct start node.",
      };
    }
  
    return traverseNode(traversal, nodeDict, startNode.name);
  }