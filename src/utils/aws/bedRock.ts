import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";


const bedrockClient = new BedrockRuntimeClient({
  region: "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_S3_USER_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_USER_SECRET_ACCESS_KEY!,
  },
});


interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}
interface invokeModelInput{
  system: string,
  max_tokens?: number,
  messages: ChatHistory[],
  modelId?: string,
  maxRetries?: number,
  baseDelayMs?: number,

}

export async function invokeModel(input: invokeModelInput) {
  const {
    
      system="",
      max_tokens = 300,
      messages,
      modelId = "anthropic.claude-3-haiku-20240307-v1:0" ,
      maxRetries = 5, // Maximum number of retry attempts
      baseDelayMs = 4000 // Base delay for exponential backoff (in milliseconds)
    
  } = input
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const modelParams = { system,max_tokens, messages, anthropic_version: "bedrock-2023-05-31" };
      const command = new InvokeModelCommand({
        modelId, // Pass the model ID here
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(modelParams), // Directly use the modelParams object
      });

      if (process.env.MOCK_BEDROCK === "true"){
        return     {
          id: 'tempId',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-5-sonnet-20241022',
          content: [
            {
              type: 'text',
              text: process.env.MOCK_BEDROCK_STR || "Mock Bedrock Response not found in env !"
            }
          ],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 0, output_tokens: 0 }
        }
      }
      const response = await bedrockClient.send(command);
      const responseBody = new TextDecoder().decode(response.body);

      return JSON.parse(responseBody);
    } catch (err) {
      const error = err as { name?: string; message?: string }; // Cast error to include optional properties

      // Check if the error is a ThrottlingException
      if (
        error?.name === "ThrottlingException" ||
        error?.message?.includes("Too many requests")
      ) {
        attempt++;
        const delay = baseDelayMs * 2 ** (attempt - 1); // Exponential backoff
        console.log(
          `ThrottlingException: Retrying attempt ${attempt} in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // If the error is not a ThrottlingException, rethrow it
        console.error("Error invoking model:", error);
        throw new Error("Failed to invoke model.");
      }
    }
  }

  // If max retries are exceeded, throw an error
  throw new Error("Failed to invoke model after maximum retries due to throttling.");
}



