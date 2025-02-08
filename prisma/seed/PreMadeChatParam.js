import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 1 });
  if (!users.length) {
    throw new Error("No users found. Add a user first.");
  }

  const userId = users[0].id;

  const preMadeChatParams = [
    {
      name: "Sales Training",
      userId,
      modelParams: JSON.stringify({
        system: "You are a homeowner, and there is a door-to-door solar panel salesman at your door trying to get you to install solar panels on your roof.",
        temperature: 0.7,
        topP: 0.9,
        topK: 250,
        maxTokens: 300,
        stopSequences: ["\n\n", "Human:"],
      }),
    },
    {
      name: "Therapy Practice",
      userId,
      modelParams: JSON.stringify({
        system: "You are a supportive therapist guiding a patient through their challenges.",
        temperature: 0.5,
        topP: 0.95,
        topK: 200,
        maxTokens: 500,
        stopSequences: ["\n\n", "Patient:"],
      }),
    },
  ];

  for (const param of preMadeChatParams) {
    await prisma.preMadeChatParam.create({ data: param });
  }

  console.log("Database has been seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });