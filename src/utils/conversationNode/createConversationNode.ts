import { ConversationNode, Role, ConversationNodeType } from "@prisma/client";

export interface ConversationNodeInput {
  role: Role;
  expectedSpeech?: string;
  nextName?: string | null;  // Now references name instead of id
  isStart?: boolean;
  isEnd?: boolean;
  options?: string[];      // Now array of names instead of ids
  traverseNumberOfOptions?: number | null;
  nodeType?: ConversationNodeType;
  name: string;           // Required field
  userId: string;
  aiWordForWord?: boolean;
  verifySpeech?: boolean;
  ignoreInTranscript?: boolean;
  fallbackNodeName?: string
  threshold?: number // threshold from 0 - 10 for single input score to match
  showVerifyFailPopUp?: boolean // whether or not to show a pop up message to the user that verification failed
}

export function createConversationNode(input: ConversationNodeInput): Omit<ConversationNode, 'id' | 'createdAt' | 'updatedAt'> {
  const {
    role,
    userId,
    expectedSpeech = "",
    nextName = null,
    isStart = false,
    isEnd = false,
    options = [],
    traverseNumberOfOptions = null,
    nodeType = "regular",
    name,
    aiWordForWord = false,
    verifySpeech = false,
    ignoreInTranscript = false,
    fallbackNodeName = null,
    threshold = 3,
    showVerifyFailPopUp = true
  } = input;

  if (nodeType === "regular" && options.length > 0 || nodeType === "options" && options.length === 0) {
    throw new Error("mismatch between options array and nodeType");
  }

  if (aiWordForWord && role === "user") {
    throw new Error("mismatch between aiWordForWord and user role");
  }

  if (fallbackNodeName && verifySpeech == false){
    throw new Error("not verifying speech, but still found a fallBackNode");
  }

  return {
    role,    
    name,
    expectedSpeech,
    nextName,
    isStart,
    isEnd,
    options,
    traverseNumberOfOptions,
    userId,
    nodeType,
    aiWordForWord,
    verifySpeech,
    ignoreInTranscript,
    preMadeChatParamId: null,
    fallbackNodeName,
    threshold,
    showVerifyFailPopUp
  };
}