import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Updating all ADMIN users to USER...');
  const result = await prisma.user.updateMany({
    where: {
      role: 'ADMIN' as any
    },
    data: {
      role: 'USER'
    }
  });
  console.log(`Updated ${result.count} users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
