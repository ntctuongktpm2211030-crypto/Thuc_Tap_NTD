import prisma from '../../../config/db';

export interface TrendingDestination {
  id: string;
  name: string;
  thumbnail: string;
  trendingScore: number;
  checkinCount: number;
  growthRate: number; // Overall weighted percentage growth
  trend: 'up' | 'down' | 'stable';
}

export async function getTrendingDestinations(limit: number = 10): Promise<TrendingDestination[]> {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const destinations = await prisma.destination.findMany({
    include: {
      _count: { select: { checkIns: true } }
    }
  });

  const trendingList = await Promise.all(
    destinations.map(async (dest) => {
      // 1. Checkin current vs previous
      const [currCheckins, prevCheckins] = await Promise.all([
        prisma.checkIn.count({ where: { destinationId: dest.id, createdAt: { gte: sevenDaysAgo, lte: now } } }),
        prisma.checkIn.count({ where: { destinationId: dest.id, createdAt: { gte: fourteenDaysAgo, lte: sevenDaysAgo } } })
      ]);

      // 2. Posts current vs previous
      const [currPosts, prevPosts] = await Promise.all([
        prisma.post.count({ where: { locationId: dest.id, deletedAt: null, createdAt: { gte: sevenDaysAgo, lte: now } } }),
        prisma.post.count({ where: { locationId: dest.id, deletedAt: null, createdAt: { gte: fourteenDaysAgo, lte: sevenDaysAgo } } })
      ]);

      // 3. Reviews (travel history) current vs previous
      const [currReviews, prevReviews] = await Promise.all([
        prisma.travelHistory.count({ where: { destinationId: dest.id, rating: { not: null }, createdAt: { gte: sevenDaysAgo, lte: now } } }),
        prisma.travelHistory.count({ where: { destinationId: dest.id, rating: { not: null }, createdAt: { gte: fourteenDaysAgo, lte: sevenDaysAgo } } })
      ]);

      // 4. Likes on location posts
      const [currLikes, prevLikes] = await Promise.all([
        prisma.like.count({ where: { post: { locationId: dest.id }, createdAt: { gte: sevenDaysAgo, lte: now } } }),
        prisma.like.count({ where: { post: { locationId: dest.id }, createdAt: { gte: fourteenDaysAgo, lte: sevenDaysAgo } } })
      ]);

      // 5. Searches relating to destination name
      const [currSearches, prevSearches] = await Promise.all([
        prisma.searchStatistics.aggregate({
          _sum: { searchCount: true },
          where: { keyword: { contains: dest.name.toLowerCase() }, date: { gte: sevenDaysAgo, lte: now } }
        }),
        prisma.searchStatistics.aggregate({
          _sum: { searchCount: true },
          where: { keyword: { contains: dest.name.toLowerCase() }, date: { gte: fourteenDaysAgo, lte: sevenDaysAgo } }
        })
      ]);

      const currSearchVal = currSearches._sum.searchCount || 0;
      const prevSearchVal = prevSearches._sum.searchCount || 0;

      // Helper to calculate rate growth
      const calcGrowth = (curr: number, prev: number): number => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      const checkinGrowth = calcGrowth(currCheckins, prevCheckins);
      const postGrowth = calcGrowth(currPosts, prevPosts);
      const reviewGrowth = calcGrowth(currReviews, prevReviews);
      const likeGrowth = calcGrowth(currLikes, prevLikes);
      const searchGrowth = calcGrowth(currSearchVal, prevSearchVal);

      // Weighted Trending Score calculation
      const trendingScore = Math.max(
        0,
        Math.round(
          searchGrowth * 0.35 +
          checkinGrowth * 0.30 +
          postGrowth * 0.15 +
          reviewGrowth * 0.10 +
          likeGrowth * 0.10
        )
      );

      // Overall growth average for client representation
      const overallGrowth = Math.round(
        (checkinGrowth + postGrowth + reviewGrowth + likeGrowth + searchGrowth) / 5
      );

      // Trend direction
      const trend = overallGrowth > 5 ? 'up' : overallGrowth < -5 ? 'down' : 'stable';

      // Fallback thumbnail
      let thumbnail = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80';
      const firstPostWithMedia = await prisma.post.findFirst({
        where: { locationId: dest.id, mediaUrls: { hasSome: [] }, deletedAt: null },
        select: { mediaUrls: true }
      });
      if (firstPostWithMedia && firstPostWithMedia.mediaUrls.length > 0) {
        thumbnail = firstPostWithMedia.mediaUrls[0];
      }

      return {
        id: dest.id,
        name: dest.name,
        thumbnail,
        trendingScore: Math.abs(trendingScore) + dest._count.checkIns * 2 + 10, // add baseline weight
        checkinCount: dest._count.checkIns,
        growthRate: overallGrowth,
        trend
      };
    })
  );

  return trendingList.sort((a, b) => b.trendingScore - a.trendingScore).slice(0, limit);
}
