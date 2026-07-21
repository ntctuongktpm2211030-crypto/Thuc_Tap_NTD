const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const destsCount = await prisma.destination.count();
  console.log(`Total destinations in DB: ${destsCount}`);
  
  const festivalCount = await prisma.destination.count({
    where: { category: 'festival' }
  });
  console.log(`Festival category destinations in DB: ${festivalCount}`);

  const festivals = await prisma.destination.findMany({
    where: { category: 'festival' },
    select: { name: true, latitude: true, longitude: true }
  });
  console.log("Festivals list:", festivals);
}

main().finally(() => prisma.$disconnect());
