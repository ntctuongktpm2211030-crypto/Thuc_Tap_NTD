import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning mock data...');
  const mockEmails = [
    'minhquan@smarttravel.com',
    'sarah@smarttravel.com',
    'linhtran@smarttravel.com',
    'alexchen@smarttravel.com',
    'tomvu@smarttravel.com',
    'davidkim@smarttravel.com',
    'anhthu@smarttravel.com'
  ];

  const mockUsers = await prisma.user.findMany({
    where: { email: { in: mockEmails } }
  });
  const mockUserIds = mockUsers.map(u => u.id);

  console.log(`Found mock users: ${mockUsers.map(u => u.email).join(', ')}`);

  const d1 = await prisma.checkIn.deleteMany({
    where: {
      OR: [
        { userId: { in: mockUserIds } },
        { id: { startsWith: 'checkin-' } }
      ]
    }
  });
  console.log(`Deleted ${d1.count} checkins.`);

  const d2 = await prisma.comment.deleteMany({
    where: {
      userId: { in: mockUserIds }
    }
  });
  console.log(`Deleted ${d2.count} comments.`);

  const d3 = await prisma.like.deleteMany({
    where: {
      userId: { in: mockUserIds }
    }
  });
  console.log(`Deleted ${d3.count} likes.`);

  const d4 = await prisma.bookmark.deleteMany({
    where: {
      userId: { in: mockUserIds }
    }
  });
  console.log(`Deleted ${d4.count} bookmarks.`);

  const d5 = await prisma.post.deleteMany({
    where: {
      OR: [
        { authorId: { in: mockUserIds } },
        { id: { in: ['h1', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'] } }
      ]
    }
  });
  console.log(`Deleted ${d5.count} posts.`);

  const d6 = await prisma.story.deleteMany({
    where: {
      userId: { in: mockUserIds }
    }
  });
  console.log(`Deleted ${d6.count} stories.`);

  const d7 = await prisma.event.deleteMany({
    where: {
      OR: [
        { organizerId: { in: mockUserIds } },
        { id: { startsWith: 'event-' } }
      ]
    }
  });
  console.log(`Deleted ${d7.count} events.`);

  const d8 = await prisma.safetyWarning.deleteMany({
    where: {
      id: { startsWith: 'warning-' }
    }
  });
  console.log(`Deleted ${d8.count} safety warnings.`);

  const d9 = await prisma.profile.deleteMany({
    where: {
      userId: { in: mockUserIds }
    }
  });
  console.log(`Deleted ${d9.count} profiles.`);

  const d10 = await prisma.user.deleteMany({
    where: {
      id: { in: mockUserIds }
    }
  });
  console.log(`Deleted ${d10.count} users.`);

  console.log('Clean completed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
