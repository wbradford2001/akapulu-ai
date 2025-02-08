import { prisma } from '../../lib/prisma';

beforeAll(async () => {
  const existingTestRun = await prisma.testRun.findUnique({
    where: {
      id: "firstTestRunObj",
    },
  });

  if (!existingTestRun) {
    await prisma.testRun.create({
      data: {
        id: "firstTestRunObj",
      },
    });
  } else {
  }
});