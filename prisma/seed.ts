import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if demo exam already exists
  const existing = await prisma.exam.findFirst();
  if (existing) {
    console.log("Database already seeded");
    return;
  }

  await prisma.exam.create({
    data: {
      id: "demo",
      title: "Sample Quiz — General Knowledge",
      description: "A short demo exam so you can try the engine immediately.",
      source: "TEXT",
      questions: {
        create: [
          {
            prompt: "What is the capital of France?",
            options: ["Berlin", "Madrid", "Paris", "Rome"],
            correctIndex: 2,
            explanation: "Paris has been the capital of France since 987 AD.",
            order: 0,
          },
          {
            prompt: "Which language runs natively in web browsers?",
            options: ["Python", "JavaScript", "C++", "Go"],
            correctIndex: 1,
            order: 1,
          },
          {
            prompt: "What does '2 + 2 * 2' evaluate to?",
            options: ["6", "8", "4", "16"],
            correctIndex: 0,
            explanation: "Multiplication precedes addition: 2 + (2*2) = 6.",
            order: 2,
          },
        ],
      },
    },
  });

  console.log("Seeded demo exam!!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
