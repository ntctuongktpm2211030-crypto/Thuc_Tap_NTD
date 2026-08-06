const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDB() {
  console.log('--- PURGING ALL USERS, POSTS, AND REGISTERED ACCOUNTS ---');
  try {
    // Execute SQL raw truncate with CASCADE to clear all user & post tables in PostgreSQL
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "Comment", "Like", "Bookmark", "CheckIn", "Post", "Trip", "TravelHistory", "Notification", "SavedPlace", "TravelPreferences", "Profile", "User" CASCADE;
    `);
    console.log('✅ TRUNCATE CASCADE succeeded! All accounts and posts deleted 100%.');
  } catch (err) {
    console.warn('Truncate CASCADE failed, running deleteMany fallback:', err.message);
    try {
      if (prisma.comment) await prisma.comment.deleteMany({});
      if (prisma.like) await prisma.like.deleteMany({});
      if (prisma.bookmark) await prisma.bookmark.deleteMany({});
      if (prisma.checkIn) await prisma.checkIn.deleteMany({});
      if (prisma.post) await prisma.post.deleteMany({});
      if (prisma.trip) await prisma.trip.deleteMany({});
      if (prisma.travelHistory) await prisma.travelHistory.deleteMany({});
      if (prisma.notification) await prisma.notification.deleteMany({});
      if (prisma.savedPlace) await prisma.savedPlace.deleteMany({});
      if (prisma.profile) await prisma.profile.deleteMany({});
      if (prisma.travelPreferences) await prisma.travelPreferences.deleteMany({});
      if (prisma.user) await prisma.user.deleteMany({});
      console.log('✅ DeleteMany fallback succeeded! All users and posts wiped.');
    } catch (e) {
      console.error('❌ DeleteMany failed:', e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

clearDB();
