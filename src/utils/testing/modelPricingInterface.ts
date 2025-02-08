import { prisma } from '../../lib/prisma';

export async function addTestCosts(
  filename: string,
  duration: number,
  claudeInput: number = 0,
  claudeOutput: number = 0,
  openAIInput: number = 0,
  openAIOutput: number = 0,
) {
  
  // Convert all inputs to safe integers, defaulting to 0 if NaN or undefined
  const safeClaudeInput = Math.max(0, Math.floor(Number(claudeInput) || 0));
  const safeClaudeOutput = Math.max(0, Math.floor(Number(claudeOutput) || 0));
  const safeOpenAIInput = Math.max(0, Math.floor(Number(openAIInput) || 0));
  const safeOpenAIOutput = Math.max(0, Math.floor(Number(openAIOutput) || 0));

  return prisma.testRun.create({
    data: {
      id: filename,
      claudeInputTokens: safeClaudeInput,
      claudeOutputTokens: safeClaudeOutput ,
      openAIInputTokens: safeOpenAIInput ,
      openAIOutputTokens: safeOpenAIOutput ,
      duration: duration
    }
  });
}
export async function getLatestRunStats() {
  const testRunsByDuration = await prisma.testRun.findMany({
    orderBy: { duration: 'desc' }
  });

  let costsSoFar = 0
  let timeSoFar = 0
  console.log("Costs and duration for all tests")
  for (const testRun of testRunsByDuration){
    if (testRun.id === "firstTestRunObj"){
      continue
    }

    const claudeCost = 
    (testRun.claudeInputTokens * (0.8/1_000_000)) + 
    (testRun.claudeOutputTokens * (4/1_000_000));
    
    // GPT-3.5-Turbo: $0.5/1M input, $1.5/1M output
    let openAICostPerMillionInput = 0;
    let openAICostPerMillionOutput = 0;
    if (process.env.OPENAIMODEL === "gpt-3.5-turbo"){
      openAICostPerMillionInput = 0.5
      openAICostPerMillionOutput = 1.5
    } else if (process.env.OPENAIMODEL === "gpt-4-turbo"){
      openAICostPerMillionInput = 1
      openAICostPerMillionOutput = 3
    }
    const openAICost = 
      (testRun.openAIInputTokens * (openAICostPerMillionInput/1_000_000)) + 
      (testRun.openAIOutputTokens * (openAICostPerMillionOutput/1_000_000));
    console.log(`=====================   ${testRun.id}   =====================`)
    console.log(`total cost: ${(openAICost + claudeCost).toFixed(4)}`)
    console.log(`   openAICost: ${openAICost.toFixed(4)}`)
    console.log(`   claudeCost: ${claudeCost.toFixed(4)}`)
    console.log(`total time: ${testRun.duration? testRun.duration/1000 : 0}`)
    console.log("")
    if (testRun.duration){
      timeSoFar += testRun.duration  
    }
    costsSoFar += openAICost + claudeCost
    
  }
  const minutes = Math.floor(timeSoFar / (1000 * 60));
  const seconds = Math.floor((timeSoFar % (1000 * 60)) / 1000);
  const durationString = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;  
  console.log()
  console.log(`Total Time for traverse: ${durationString}`)
  console.log(`Total cost for traverse: ${costsSoFar.toFixed(4)}`)

  // total time
  const firstNode = await prisma.testRun.findUnique({
    where: {
      id: "firstTestRunObj"
    }
  })
  if (firstNode){
    const totalDuration = new Date().getTime() - firstNode.createdAt.getTime()
    const minutes = Math.floor(totalDuration / (1000 * 60));
    const seconds = Math.floor((totalDuration % (1000 * 60)) / 1000);
    const durationString = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;   
    console.log("")   
    console.log(`total time: ${durationString}`)
  }

  // delete all test runs
  await prisma.testRun.deleteMany({})

}