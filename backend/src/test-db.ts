import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('DIRECT_URL:', process.env.DIRECT_URL);
  
  const count = await prisma.user.count();
  console.log('Connection successful! Total users in DB:', count);
}

main()
  .catch((err) => {
    console.error('Database connection failed:');
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
