import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const BACKUP_PATH = path.resolve(__dirname, 'migration_backup.json');

async function backup() {
  console.log('📦 Starting backup of old tables...');
  try {
    const itineraries = await prisma.$queryRawUnsafe('SELECT * FROM "Itinerary"').catch(() => []);
    const itineraryDays = await prisma.$queryRawUnsafe('SELECT * FROM "ItineraryDay"').catch(() => []);
    const itineraryActivities = await prisma.$queryRawUnsafe('SELECT * FROM "ItineraryActivity"').catch(() => []);
    
    const placeCaches = await prisma.$queryRawUnsafe('SELECT * FROM "PlaceCache"').catch(() => []);
    const foodCaches = await prisma.$queryRawUnsafe('SELECT * FROM "FoodCache"').catch(() => []);
    const blogCaches = await prisma.$queryRawUnsafe('SELECT * FROM "BlogCache"').catch(() => []);

    const backupData = {
      itineraries,
      itineraryDays,
      itineraryActivities,
      placeCaches,
      foodCaches,
      blogCaches
    };

    fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`✅ Backup successfully saved to ${BACKUP_PATH}`);
    console.log(`   - Itineraries: ${itineraries.length}`);
    console.log(`   - ItineraryDays: ${itineraryDays.length}`);
    console.log(`   - ItineraryActivities: ${itineraryActivities.length}`);
    console.log(`   - PlaceCaches: ${placeCaches.length}`);
    console.log(`   - FoodCaches: ${foodCaches.length}`);
    console.log(`   - BlogCaches: ${blogCaches.length}`);
  } catch (e: any) {
    console.error('❌ Backup failed:', e.message);
  }
}

async function restore() {
  console.log('🔄 Restoring backup to new tables...');
  if (!fs.existsSync(BACKUP_PATH)) {
    console.error('❌ Backup file not found!');
    return;
  }

  const backupData = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
  const { itineraries, itineraryDays, itineraryActivities, placeCaches, foodCaches, blogCaches } = backupData;

  // 1. Restore Caches
  console.log('   - Restoring SystemCache...');
  const cacheData: any[] = [];
  
  for (const c of placeCaches) {
    cacheData.push({ key: c.key, type: 'place', value: c.value, expiresAt: new Date(c.expiresAt), createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) });
  }
  for (const c of foodCaches) {
    cacheData.push({ key: c.key, type: 'food', value: c.value, expiresAt: new Date(c.expiresAt), createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) });
  }
  for (const c of blogCaches) {
    cacheData.push({ key: c.key, type: 'blog', value: c.value, expiresAt: new Date(c.expiresAt), createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) });
  }

  if (cacheData.length > 0) {
    await prisma.systemCache.createMany({
      data: cacheData,
      skipDuplicates: true
    });
    console.log(`     ✅ Restored ${cacheData.length} cache items.`);
  }

  // 2. Restore Itineraries as Trips
  console.log('   - Restoring Itineraries to Trips (status: DRAFT_AI)...');
  for (const it of itineraries) {
    const matchedDays = itineraryDays.filter((d: any) => d.itineraryId === it.id);
    
    // Create Trip, days and activities in a single transaction/nested insert
    await prisma.trip.create({
      data: {
        id: it.id,
        ownerId: it.userId,
        title: it.title,
        description: it.description || null,
        destinationName: 'Chưa xác định',
        status: 'DRAFT_AI',
        createdAt: new Date(it.createdAt),
        updatedAt: new Date(it.updatedAt),
        days: {
          create: matchedDays.map((d: any) => {
            const matchedActs = itineraryActivities.filter((a: any) => a.itineraryDayId === d.id);
            return {
              id: d.id,
              dayIndex: d.dayIndex,
              date: d.date ? new Date(d.date) : null,
              activities: {
                create: matchedActs.map((a: any) => ({
                  id: a.id,
                  title: a.title,
                  location: a.location || null,
                  description: a.description || null,
                  startTime: a.startTime || null,
                  endTime: a.endTime || null,
                  estimatedCost: a.cost || 0.0,
                  sequenceOrder: 1, // default
                }))
              }
            };
          })
        }
      }
    }).catch(e => {
      console.error(`     ⚠️ Failed to restore itinerary ${it.id}:`, e.message);
    });
  }
  console.log('✅ Restore complete!');
}

const action = process.argv[2];
if (action === 'backup') {
  backup().then(() => prisma.$disconnect());
} else if (action === 'restore') {
  restore().then(() => prisma.$disconnect());
} else {
  console.log('Usage: ts-node migrate-refactor.ts [backup|restore]');
}
