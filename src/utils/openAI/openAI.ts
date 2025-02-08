import fs from "fs";
import path from "path";


import OpenAI from "openai";

const openai = new OpenAI();
import {ConversationNode} from '@prisma/client'

// import {customLog} from "../../utils/testing/logger"


export async function validateWithOpenAI(
  expectedSpeech: string,
  userInput: string,
  threshold: number
): Promise<{ 

  // validation
  match: boolean; 
  score:number, 
  explanation: string,

  // IO
  inputTokensUsed:number,
  outputTokensUsed:number,
 }> {
  // extract prompt
  const noOptionPrompt = fs.readFileSync(
    path.resolve(__dirname, "noOptionPrompt.txt"), // Adjust the path as needed
    "utf8"
  );


  // extract JSON
  const examplesPath = path.resolve(__dirname, "noOptionExamples.json");
  const examples = JSON.parse(fs.readFileSync(examplesPath, "utf8"));

  if (!examples){
    throw new Error(`no examples!`)
  }

  if (!noOptionPrompt){
    throw new Error(`no prompt!`)
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: noOptionPrompt
    },
    ...examples,
    // Dynamic Input
    {
      role: "user",
      content: `The user is supposed to: "${expectedSpeech}"
      user Response: "${userInput}".`
    }
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAIMODEL as string,
    messages,
    temperature: 0,
    max_tokens: 100 // Limit to short responses
  });

  const modelResponse = completion.choices[0].message.content?.trim();

  const inputTokens = completion.usage?.prompt_tokens;
  const outputTokens = completion.usage?.completion_tokens;
  

  if (modelResponse) {
    const [scoreStr, explanation] = modelResponse.split(";").map((part) => part.trim());
    const score = parseInt(scoreStr, 10);

    if (isNaN(score)) {
      throw new Error(`Invalid model response: "${modelResponse}". Expected a numeric score followed by an explanation.`);
    }

    // Determine match based on a threshold
    const match = score >= threshold;

    return {
      match,
      score,
      explanation: explanation || "No explanation provided.",
      inputTokensUsed: inputTokens? inputTokens : 0,
      outputTokensUsed: outputTokens ? outputTokens: 0,
    };
  }

  throw new Error(`Invalid response from OpenAI: "${modelResponse}"`);
}


export async function validateMultipleWithOpenAI(
  currentNode: string,
  scriptJson: Record<string, ConversationNode>,
  userInput: string,
): Promise<{
  // validation
  match: boolean; // whether or not we found a match
  score: number;// our confident in out pick
  explanation: string; // explanation of why we chose the option node

  // IO
  inputTokensUsed: number ; // input tokens user for this request
  outputTokensUsed: number; // output tokens used for this request
  
  // node traversal
  nextUserNode: string | null; // the chosen user option node
}> {
  // extract prompt
  const optionPrompt = fs.readFileSync(
    path.resolve(__dirname, "optionPrompt.txt"), // Adjust the path as needed
    "utf8"
  );


  // extract JSON
  const examplesPath = path.resolve(__dirname, "optionExamples.json");
  const examples = JSON.parse(fs.readFileSync(examplesPath, "utf8")); 
  

  if (!examples){
    throw new Error(`no examples!`)
  }

  if (!optionPrompt){
    throw new Error(`no prompt!`)
  }
  
  
  const currentUserOptionsNodeData: ConversationNode = scriptJson[currentNode];


  if (!currentUserOptionsNodeData.options){
    throw new Error(`No options for ${currentNode}`)
  }
  for (const option of currentUserOptionsNodeData.options){
    if (!scriptJson[option] || !scriptJson[option].expectedSpeech){
      throw new Error(`error in options array: ${currentUserOptionsNodeData.options} with script: ${scriptJson}`)
    }
  }

  const validOptions = currentUserOptionsNodeData.options.filter(opt => 
    scriptJson[opt]?.expectedSpeech
  );

  if (!validOptions){
    throw new Error(`no valid options for ${currentNode}`)
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: optionPrompt
    },
    ...examples,
    {
      role: "user",
      content: `User said: "${userInput}"
      Compare against these behaviors:
${validOptions.map((opt, i) => 
`           ${i}: "${scriptJson[opt]?.expectedSpeech}"`).join('\n')}
      Which option index matches best?`
    }
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0,
    max_tokens: 60
  });

  const modelResponse = completion.choices[0].message.content?.trim();
  if (!modelResponse){
    throw new Error("No Model Response!")
  }
  const [indexStr, score, explanation] = (modelResponse || '').split(';').map(s => s.trim());
  
  
  // validate response
  let matchIndex: number = -1
  if (indexStr !== 'none'){
    matchIndex = parseInt(indexStr, 10);
    if (isNaN(matchIndex) || matchIndex < 0 || matchIndex >= validOptions.length){
      throw new Error(`Error in options validation with indexStr ${indexStr}`)
    }    
  }
  const scoreNumber = parseInt(score, 10);
  if (isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 10) {
    throw new Error(`Error in options validation with score ${score}`)
  }

  // no option matched
  if (indexStr === 'none') {
    const inputTokens = completion.usage?.prompt_tokens
    const outputTokens = completion.usage?.completion_tokens
    return {
      // validation
      match: false,
      score: scoreNumber,
      explanation: explanation,

      // IO
      inputTokensUsed: inputTokens ? inputTokens : 0,
      outputTokensUsed: outputTokens ? outputTokens : 0,

      // node traversal
      nextUserNode: null,

    };
  }

  if (matchIndex == -1){
    throw new Error(`No match index for ${currentNode} with model resspojnse ${modelResponse}`)
  }

  // valid option chosen
  const inputTokens = completion.usage?.prompt_tokens
  const outputTokens = completion.usage?.completion_tokens
  return {
    // validation
    match: true,
    score: scoreNumber,
    explanation: explanation,

    // io stuff
    inputTokensUsed: inputTokens ? inputTokens : 0,
    outputTokensUsed: outputTokens ? outputTokens : 0,

    // node traversal
    nextUserNode: validOptions[matchIndex],


  };
}