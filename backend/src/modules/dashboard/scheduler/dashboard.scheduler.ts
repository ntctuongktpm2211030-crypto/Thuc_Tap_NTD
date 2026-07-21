import prisma from '../../../config/db';
import { getDeterministicPostMetrics } from '../repositories/dashboard.repository';

export function startStatsAggregationScheduler() {
  console.log('[StatsScheduler] Khởi tạo tác vụ tổng hợp dữ liệu thống kê ngầm định kỳ.');
  
  // Chạy lần đầu tiên sau khi khởi động server 10 giây
  setTimeout(runAggregationTask, 10000);

  // Chạy định kỳ mỗi 1 giờ để đồng bộ dữ liệu (3600000 ms)
  setInterval(runAggregationTask, 60 * 60 * 1000);
}

export async function runAggregationTask() {
  console.log(`[StatsScheduler] [${new Date().toISOString()}] Bắt đầu chạy tác vụ tổng hợp thống kê...`);
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Calculate Daily Stats
    const [
      newUsers,
      newPosts,
      newLikes,
      newComments,
      newReviews,
      newCheckins,
      newFollowers
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.post.count({ where: { createdAt: { gte: today, lt: tomorrow }, deletedAt: null } }),
      prisma.like.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.comment.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.travelHistory.count({ where: { createdAt: { gte: today, lt: tomorrow }, rating: { not: null } } }),
      prisma.checkIn.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.follower.count({ where: { createdAt: { gte: today, lt: tomorrow } } })
    ]);

    // Aggregate searches for today
    const searches = await prisma.searchStatistics.aggregate({
      _sum: { searchCount: true },
      where: { date: { gte: today, lt: tomorrow } }
    });
    const totalSearches = searches._sum.searchCount || 0;

    // Fetch active users (users who updated their profile or posted/liked/commented today)
    const activeUsersTodayList = await prisma.$queryRaw<Array<{ userId: string }>>`
      SELECT DISTINCT "userId" FROM (
        SELECT "id" as "userId" FROM "User" WHERE "updatedAt" >= ${today} AND "updatedAt" < ${tomorrow}
        UNION
        SELECT "authorId" as "userId" FROM "Post" WHERE "createdAt" >= ${today} AND "createdAt" < ${tomorrow} AND "deletedAt" IS NULL
        UNION
        SELECT "authorId" as "userId" FROM "Comment" WHERE "createdAt" >= ${today} AND "createdAt" < ${tomorrow}
        UNION
        SELECT "userId" as "userId" FROM "Like" WHERE "createdAt" >= ${today} AND "createdAt" < ${tomorrow}
        UNION
        SELECT "userId" as "userId" FROM "CheckIn" WHERE "createdAt" >= ${today} AND "createdAt" < ${tomorrow}
      ) AS active_today;
    `;
    const activeUsers = activeUsersTodayList.length;

    // Upsert into DailyStatistics
    await prisma.dailyStatistics.upsert({
      where: { date: today },
      update: {
        newUsers,
        activeUsers,
        newPosts,
        newLikes,
        newComments,
        newReviews,
        newCheckins,
        newFollowers,
        totalSearches
      },
      create: {
        date: today,
        newUsers,
        activeUsers,
        newPosts,
        newLikes,
        newComments,
        newReviews,
        newCheckins,
        newFollowers,
        totalSearches
      }
    });

    // 2. Calculate Hourly Stats for today
    const currentDayOfWeek = today.getDay(); // 0 (Sun) -> 6 (Sat)
    const currentHour = new Date().getHours();

    const hourlyActivityCount = newUsers + newPosts + newLikes + newComments + newCheckins + newFollowers;

    if (hourlyActivityCount > 0) {
      const existingHourly = await prisma.hourlyStatistics.findUnique({
        where: { dayOfWeek_hour: { dayOfWeek: currentDayOfWeek, hour: currentHour } }
      });
      const previousCount = existingHourly ? existingHourly.count : 0;

      await prisma.hourlyStatistics.upsert({
        where: { dayOfWeek_hour: { dayOfWeek: currentDayOfWeek, hour: currentHour } },
        update: { count: previousCount + hourlyActivityCount },
        create: { dayOfWeek: currentDayOfWeek, hour: currentHour, count: hourlyActivityCount }
      });
    }

    // 3. Calculate Province Statistics for checkins created today
    const checkinsToday = await prisma.checkIn.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      include: { destination: { select: { address: true } } }
    });

    const provinceCounts: Record<string, { checkins: number; posts: number; likes: number }> = {};

    checkinsToday.forEach(c => {
      if (c.destination && c.destination.address) {
        const prov = extractProvinceFromAddress(c.destination.address);
        if (!provinceCounts[prov]) {
          provinceCounts[prov] = { checkins: 0, posts: 0, likes: 0 };
        }
        provinceCounts[prov].checkins++;
      }
    });

    // Write all accumulated province stats to DB
    await Promise.all(
      Object.entries(provinceCounts).map(async ([provName, counts]) => {
        // Query post counts and likes for this province today
        const [postsCount, likesCount] = await Promise.all([
          prisma.post.count({
            where: {
              createdAt: { gte: today, lt: tomorrow },
              deletedAt: null,
              destination: { address: { contains: provName, mode: 'insensitive' } }
            }
          }),
          prisma.like.count({
            where: {
              createdAt: { gte: today, lt: tomorrow },
              post: { destination: { address: { contains: provName, mode: 'insensitive' } } }
            }
          })
        ]);

        await prisma.provinceStatistics.upsert({
          where: { date_province: { date: today, province: provName } },
          update: {
            checkinCount: counts.checkins,
            postCount: postsCount,
            likeCount: likesCount
          },
          create: {
            date: today,
            province: provName,
            checkinCount: counts.checkins,
            postCount: postsCount,
            likeCount: likesCount
          }
        });
      })
    );

    console.log('[StatsScheduler] Hoàn tất đồng bộ dữ liệu tổng hợp thống kê.');
  } catch (err) {
    console.error('[StatsScheduler] Lỗi trong lúc tổng hợp dữ liệu thống kê:', err);
  }
}

// Simple Vietnamese province parser utility
function extractProvinceFromAddress(address: string): string {
  const clean = address.toLowerCase();
  const provinces = [
    'thái nguyên', 'hà nội', 'hải phòng', 'đà nẵng', 'thành phố hồ chí minh', 'tphcm', 'sài gòn',
    'hà giang', 'cao bằng', 'lào cai', 'sơn la', 'lai châu', 'yên bái', 'điện biên',
    'lạng sơn', 'tuyên quang', 'quảng ninh', 'bắc giang', 'bắc kạn', 'phú thọ', 'vĩnh phúc',
    'bắc ninh', 'hải dương', 'hưng yên', 'thái bình', 'hà nam', 'nam định', 'ninh bình',
    'thanh hóa', 'nghệ an', 'hà tĩnh', 'quảng bình', 'quảng trị', 'thừa thiên huế', 'huế',
    'quảng nam', 'quảng ngãi', 'bình định', 'phú yên', 'khánh hòa', 'nha trang', 'ninh thuận',
    'binh thuận', 'kon tum', 'gia lai', 'đắk lắk', 'đắk nông', 'lâm đồng', 'đà lạt',
    'bình phước', 'tây ninh', 'bình dương', 'đồng nai', 'bà rịa vũng tàu', 'vũng tàu',
    'long an', 'đồng tháp', 'tiền giang', 'an giang', 'bến tre', 'vĩnh long', 'trà vinh',
    'hậu giang', 'kiên giang', 'phú quốc', 'sóc trăng', 'bạc liêu', 'cà mau', 'cần thơ'
  ];

  for (const prov of provinces) {
    if (clean.includes(prov)) {
      if (prov === 'tphcm' || prov === 'sài gòn') return 'Thành phố Hồ Chí Minh';
      if (prov === 'huế') return 'Thừa Thiên Huế';
      if (prov === 'vũng tàu') return 'Bà Rịa Vũng Tàu';
      if (prov === 'phú quốc') return 'Kiên Giang';
      if (prov === 'đà lạt') return 'Lâm Đồng';
      if (prov === 'nha trang') return 'Khánh Hòa';
      return prov.charAt(0).toUpperCase() + prov.slice(1);
    }
  }

  return 'Khác';
}
