export type ChatParamDefinition = {
    type: "float" | "integer" | "string" | "array"; // Updated types
    required: boolean;
    min?: number;
    max?: number;
    default: number | string | string[];
    enum?: string[]
    includeInDefaultUI: boolean;
    description: string;
  };

  
  // Define model-specific parameters
  const defaultModelParams: Record<string, ChatParamDefinition> = {
    temperature: {
      type: "float",
      required: true,
      min: 0,
      max: 1,
      default: 0.7,
      includeInDefaultUI: false,
      description: "Controls randomness in the model's responses. Lower values make the output more deterministic.",
    },
    top_p: {
      type: "float",
      required: true,
      min: 0,
      max: 1,
      default: 0.9,
      includeInDefaultUI: false,
      description: "Probability mass for nucleus sampling. Higher values include more tokens in sampling.",
    },
    top_k: {
      type: "integer",
      required: true,
      min: 0,
      max: 1000,
      default: 250,
      includeInDefaultUI: false,
      description: "Limits sampling to the top K tokens. Lower values constrain token selection.",
    },
    max_tokens: {
      type: "integer",
      required: true,
      min: 1,
      max: 2000,
      default: 300,
      includeInDefaultUI: true,
      description: "Maximum number of tokens to generate in the response.",
    },
    stop_sequences: {
      type: "array",
      required: true,
      default: ["\n\nHuman:", "user:", "assistant:"],
      includeInDefaultUI: false,
      description: "Sequences that will halt response generation when encountered.",
    },
    system: {
      type: "string",
      required: true,
      default: "You are a helpful assistant.",
      includeInDefaultUI: true,
      description: "System-level instruction defining the assistant's role or behavior.",
    },

  };
  
  // Define custom parameters
  const defaultCustomParams: Record<string, ChatParamDefinition> = {
    maxTokens: {
      type: "integer",
      required: true,
      min: 1,
      max: 10000,
      default: 5000,
      includeInDefaultUI: true,
      description: "Maximum length of the conversation in tokens.",
    },
    maxTime: {
      type: "integer",
      required: true,
      min: 10,
      max: 600000,
      default: 180000,
      includeInDefaultUI: true,
      description: "Maximum length of the conversation in milliseconds.",
    },    
    attitude: {
      type: "string",
      required: true,
      default: "Neutral",
      enum: ["Neutral", "Skeptical", "Assistant"],
      includeInDefaultUI: true,
      description: "The attitude of the model",
    },
    conversationType: {
      type: "string",
      required: true,
      default: "Normal",
      enum: ["Normal", "Sales Call", "Phone Bot", "Phone Call"],
      includeInDefaultUI: true,
      description: "The conversation type of the model",
    },    
  };
  
export function fillInDefaults(inputParams: Record<string, unknown>, defaultParams: Record<string, ChatParamDefinition>){

  const finalParams = Object.fromEntries(
    Object.entries(defaultParams).map(([key, definition]) => [
      key,
      inputParams[key] !== undefined ? inputParams[key] : definition.default,
    ])
  );

  return finalParams
}

export function validateParams(
  inputParams: Record<string, unknown>,
  defaultParams: Record<string, ChatParamDefinition>
): boolean {
  // 1) Check for unknown keys in inputParams
  for (const key of Object.keys(inputParams)) {
    if (!(key in defaultParams)) {
      // The user supplied a key that doesn't exist in our defaults
      return false;
    }
  }

  // 2) Check required fields
  for (const [key, definition] of Object.entries(defaultParams)) {
    if (definition.required && inputParams[key] === undefined) {
      
      // A required param is missing
      return false;
    }
  }

  // 3) Validate each provided value
  for (const [key, definition] of Object.entries(defaultParams)) {
    const userValue = inputParams[key];
    // If the user didn't supply this param and it's not required, skip validation
    // (We only fail if it's required and missing, handled above)
    if (userValue === undefined) {
      continue;
    }

    // Check type
    switch (definition.type) {
      case "integer":
      case "float": {
        if (typeof userValue !== "number") {
          
          return false;
        }
        // min/max checks
        if (definition.min !== undefined && userValue < definition.min) {
          
          return false;
        }
        if (definition.max !== undefined && userValue > definition.max) {
          
          return false;
        }
        break;
      }
      case "string": {
        if (typeof userValue !== "string") {
          
          return false;
        }
        // enum check
        if (definition.enum && !definition.enum.includes(userValue)) {
          
          return false;
        }
        break;
      }
      case "array": {
        if (!Array.isArray(userValue)) {
          
          return false;
        }
        break;
      }
      default:
        // If somehow the definition type is invalid, fail
        
        return false;
    }
  }

  // If we haven’t returned false, everything is valid
  return true;
}


  export { defaultModelParams, defaultCustomParams };