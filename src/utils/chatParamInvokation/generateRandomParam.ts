import { defaultModelParams, defaultCustomParams, ChatParamDefinition } from "./chatParamInvokationDefaults";


  function generateRandomValue(
    key: string,
    definition: ChatParamDefinition
  ): number | string | string[] | null {
    if (definition.type === "float") {
      if (definition.min !== undefined && definition.max !== undefined) {
        const range = definition.max - definition.min;
        return parseFloat((definition.min + Math.random() * range).toFixed(2)); // Limit precision to 2 decimals
      }
      throw new Error(`Missing min or max for float chat param: ${key}`);
    } else if (definition.type === "integer") {
      if (definition.min !== undefined && definition.max !== undefined) {
        const range = definition.max - definition.min;
        return Math.floor(definition.min + Math.random() * (range + 1)); // Generate an integer
      }
      throw new Error(`Missing min or max for integer chat param: ${key}`);
    } else if (definition.type === "string") {
      if (definition.enum){
        const index = Math.random()*definition.enum.length
        return definition.enum[index]
      }
      return `${key} value ${Math.random().toString(36).substring(2, 8)}`;
    } else if (definition.type === "array") {
      return [`Generated ${key} ${Math.random().toString(36).substring(2, 8)}`];
    }
    return null;
  }
export default function generateRandomParams(paramType: typeof defaultCustomParams | typeof defaultModelParams) {
  return Object.fromEntries(
    Object.entries(paramType).map(([key, definition]) => [
      key,
      generateRandomValue(key, definition),
    ])
  );
}