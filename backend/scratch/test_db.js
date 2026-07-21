const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Connecting to DB and checking posts...");
    const posts = await prisma.post.findMany({
      take: 2,
      include: {
        author: { include: { profile: true } },
      }
    });
    console.log("Fetched posts successfully:", posts.length);
  } catch (err) {
    console.error("DB Posts Error:", err);
  }

  try {
    console.log("Checking notifications...");
    const notifications = await prisma.notification.findMany({
      take: 2,
    });
    console.log("Fetched notifications successfully:", notifications.length);
  } catch (err) {
    console.error("DB Notifications Error:", err);
  }

  finally {
    await prisma.$disconnect();
  }
}

run();
