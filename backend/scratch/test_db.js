const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Connecting to DB...");
    const conn = await prisma.chatConversation.create({
      data: {
        userId: '00000000-0000-0000-0000-000000000000', // Mock UUID if FK constraints exist
        title: 'Test Conversation',
      }
    });
    console.log("Created successfully:", conn);
    await prisma.chatConversation.delete({ where: { id: conn.id } });
    console.log("Deleted successfully.");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
