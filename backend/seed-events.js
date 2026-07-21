const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found to organize events! Please register a user first.");
    return;
  }
  
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(now.getMonth() + 1);

  // Clear existing test events to avoid duplication
  await prisma.event.deleteMany({
    where: {
      title: {
        in: [
          "Le hoi Banh Dan Gian Nam Bo (Can Tho)",
          "Le hoi Ky Yen Dinh Binh Thuy (Can Tho)",
          "Le hoi Nghinh Ong Song Doc (Ca Mau)"
        ]
      }
    }
  });

  const events = [
    {
      title: "Le hoi Banh Dan Gian Nam Bo (Can Tho)",
      description: "Le hoi quy tu hang tram gian hang banh dan gian dac sac Nam Bo tai khu vuc Can Tho.",
      latitude: 10.035,
      longitude: 105.782,
      startDate: now,
      endDate: nextMonth,
      category: "festival",
      organizerId: user.id
    },
    {
      title: "Le hoi Ky Yen Dinh Binh Thuy (Can Tho)",
      description: "Le hoi van hoa tam linh truyen thong dac sac tai Dinh Binh Thuy.",
      latitude: 10.058,
      longitude: 105.776,
      startDate: now,
      endDate: nextMonth,
      category: "cultural",
      organizerId: user.id
    },
    {
      title: "Le hoi Nghinh Ong Song Doc (Ca Mau)",
      description: "Le hoi nghinh Ong truyen thong cua ngu duong Song Doc, Ca Mau.",
      latitude: 9.182,
      longitude: 105.150,
      startDate: now,
      endDate: nextMonth,
      category: "festival",
      organizerId: user.id
    }
  ];

  for (const ev of events) {
    const created = await prisma.event.create({ data: ev });
    console.log(`Created event: ${created.title} at [${created.latitude}, ${created.longitude}]`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
