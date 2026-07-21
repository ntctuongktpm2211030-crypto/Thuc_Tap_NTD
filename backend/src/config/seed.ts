import prisma from './db';
import fs from 'fs';
import path from 'path';

export async function autoSeed() {
  try {
    console.log('🌱 Starting database auto-seeding & syncing...');

    // 1. Delete all mock / seeded data if they exist
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

    if (mockUserIds.length > 0) {
      console.log(`🧹 Removing mock data for users: ${mockEmails.join(', ')}`);

      // Delete checkins
      await prisma.checkIn.deleteMany({
        where: {
          OR: [
            { userId: { in: mockUserIds } },
            { id: { startsWith: 'checkin-' } }
          ]
        }
      });

      // Delete comments
      await prisma.comment.deleteMany({
        where: { authorId: { in: mockUserIds } }
      });

      // Delete likes
      await prisma.like.deleteMany({
        where: { userId: { in: mockUserIds } }
      });

      // Delete bookmarks
      await prisma.bookmark.deleteMany({
        where: { userId: { in: mockUserIds } }
      });

      // Delete posts
      await prisma.post.deleteMany({
        where: {
          OR: [
            { authorId: { in: mockUserIds } },
            { id: { in: ['h1', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'] } }
          ]
        }
      });

      // Delete stories
      await prisma.journey.deleteMany({
        where: { userId: { in: mockUserIds } }
      });

      // Delete events
      await prisma.event.deleteMany({
        where: {
          OR: [
            { organizerId: { in: mockUserIds } },
            { id: { startsWith: 'event-' } }
          ]
        }
      });

      // Delete profiles
      await prisma.profile.deleteMany({
        where: { userId: { in: mockUserIds } }
      });

      // Delete users
      await prisma.user.deleteMany({
        where: { id: { in: mockUserIds } }
      });
    }

    // Delete safety warnings that are mock
    await prisma.safetyWarning.deleteMany({
      where: { id: { startsWith: 'warning-' } }
    });

    console.log('✅ Cleaned up all mock users, posts, checkins, stories, and events.');

    // 2. Create or Update Real Destinations
    const destinationsToSeed = [
      {
        id: 'dest-1',
        name: 'Hồ Hoàn Kiếm',
        description: 'Hồ nước ngọt tự nhiên nằm ở trung tâm thành phố Hà Nội.',
        latitude: 21.028511,
        longitude: 105.804817,
        category: 'attraction',
        averageRating: 4.8,
        address: 'Hàng Trống, Hoàn Kiếm, Hà Nội, Việt Nam',
        openingHours: '24/7'
      },
      {
        id: 'dest-2',
        name: 'Lăng Chủ tịch Hồ Chí Minh',
        description: 'Nơi đặt thi hài của Chủ tịch Hồ Chí Minh.',
        latitude: 21.0368,
        longitude: 105.8346,
        category: 'attraction',
        averageRating: 4.9,
        address: 'Hùng Vương, Điện Biên, Ba Đình, Hà Nội, Việt Nam',
        openingHours: '07:30 - 10:30'
      },
      {
        id: 'dest-3',
        name: 'Văn Miếu - Quốc Tử Giám',
        description: 'Trường đại học đầu tiên của Việt Nam.',
        latitude: 21.0293,
        longitude: 105.8359,
        category: 'attraction',
        averageRating: 4.7,
        address: '58 Quốc Tử Giám, Văn Miếu, Đống Đa, Hà Nội, Việt Nam',
        openingHours: '08:00 - 17:00'
      },
      {
        id: 'dest-4',
        name: 'Nhà hát Lớn Hà Nội',
        description: 'Công trình kiến trúc lâu đời và tiêu biểu tại trung tâm Hà Nội.',
        latitude: 21.0242,
        longitude: 105.8562,
        category: 'attraction',
        averageRating: 4.6,
        address: '1 Tràng Tiền, Phan Chu Trinh, Hoàn Kiếm, Hà Nội, Việt Nam',
        openingHours: '09:00 - 17:00'
      },
      {
        id: 'dest-5',
        name: 'Cầu Vàng (Golden Bridge)',
        description: 'Cầu đi bộ nổi tiếng tại khu du lịch Bà Nà Hills, Đà Nẵng.',
        latitude: 15.9984,
        longitude: 107.9972,
        category: 'attraction',
        averageRating: 4.9,
        address: 'Hòa Vang, Đà Nẵng, Việt Nam',
        openingHours: '08:00 - 18:00'
      }
    ];

    for (const d of destinationsToSeed) {
      await prisma.destination.upsert({
        where: { id: d.id },
        update: {
          name: d.name,
          description: d.description,
          latitude: d.latitude,
          longitude: d.longitude,
          category: d.category,
          averageRating: d.averageRating,
          address: d.address,
          openingHours: d.openingHours
        },
        create: d
      });
    }

    // 3. Import Destinations from JSON files if not already imported
    const destCount = await prisma.destination.count();
    if (destCount < 3000) {
      console.log('📦 Seeding destinations from JSON files...');
      const destDir = path.resolve(__dirname, 'destinations');
      if (fs.existsSync(destDir)) {
        const files = fs.readdirSync(destDir);
        const allDests: any[] = [];
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          const filePath = path.join(destDir, file);
          try {
            const fileItems = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (Array.isArray(fileItems)) {
              for (const item of fileItems) {
                const id = 'dest-' + item.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50) + '-' + (item.latitude || 0).toFixed(4) + '-' + (item.longitude || 0).toFixed(4);
                allDests.push({
                  id,
                  name: item.title,
                  description: item.content || null,
                  latitude: item.latitude || 0,
                  longitude: item.longitude || 0,
                  category: item.category || 'attraction',
                  averageRating: 4.5 + Math.random() * 0.5,
                  address: item.address || null,
                  openingHours: '08:00 - 18:00'
                });
              }
            }
          } catch (e: any) {
            console.error(`Error parsing ${file}:`, e.message);
          }
        }
        
        if (allDests.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < allDests.length; i += chunkSize) {
            const chunk = allDests.slice(i, i + chunkSize);
            await prisma.destination.createMany({
              data: chunk,
              skipDuplicates: true
            });
          }
          console.log(`✅ Loaded ${allDests.length} destinations into database.`);
        }
      }
    } else {
      console.log('✨ Destinations already seeded in database.');
    }

    console.log('🌿 Database auto-seeding and purge completed successfully.');
  } catch (err) {
    console.error('❌ Error during auto-seed:', err);
  }
}
