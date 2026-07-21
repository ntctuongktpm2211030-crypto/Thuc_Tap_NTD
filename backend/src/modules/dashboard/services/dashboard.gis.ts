import prisma from '../../../config/db';
import { getDeterministicPostMetrics } from '../repositories/dashboard.repository';

export interface GisHotspot {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  checkinCount: number;
  reviewCount: number;
  likeCount: number;
  hotScore: number;
  thumbnail: string;
  topPosts: Array<{
    id: string;
    title: string;
    author: string;
    likes: number;
  }>;
}

export async function getGisHotspots(): Promise<GisHotspot[]> {
  const destinations = await prisma.destination.findMany({
    include: {
      _count: {
        select: {
          checkIns: true,
          travelHistories: true
        }
      },
      checkIns: {
        select: {
          userId: true
        }
      }
    }
  });

  const hotspots = await Promise.all(
    destinations.map(async (dest) => {
      // Find posts written at this destination to get images and likes
      const posts = await prisma.post.findMany({
        where: { locationId: dest.id, deletedAt: null },
        take: 5,
        include: {
          author: { select: { name: true } },
          _count: { select: { likes: true, comments: true } }
        }
      });

      // Sum likes and find first image
      let likeCount = 0;
      let thumbnail = '';
      const topPosts: GisHotspot['topPosts'] = [];

      posts.forEach((p) => {
        // Post metrics logic using deterministic scaler
        const scaled = getDeterministicPostMetrics(p.id, p._count.likes, p._count.comments);
        likeCount += scaled.likes;
        
        if (!thumbnail && p.mediaUrls && p.mediaUrls.length > 0) {
          thumbnail = p.mediaUrls[0];
        }

        topPosts.push({
          id: p.id,
          title: p.content.substring(0, 40) + (p.content.length > 40 ? '...' : ''),
          author: p.author.name,
          likes: scaled.likes
        });
      });

      // Default fallback images matching destination categories
      if (!thumbnail) {
        const cat = dest.category.toLowerCase();
        if (cat.includes('hotel')) {
          thumbnail = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
        } else if (cat.includes('restaurant') || cat.includes('food')) {
          thumbnail = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80';
        } else {
          thumbnail = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80';
        }
      }

      const checkinCount = dest._count.checkIns;
      const reviewCount = dest._count.travelHistories;
      const hotScore = checkinCount * 4 + reviewCount * 3 + likeCount + 10; // offset

      return {
        id: dest.id,
        name: dest.name,
        category: dest.category,
        address: dest.address || 'Việt Nam',
        latitude: dest.latitude,
        longitude: dest.longitude,
        checkinCount,
        reviewCount,
        likeCount,
        hotScore,
        thumbnail,
        topPosts: topPosts.slice(0, 3)
      };
    })
  );

  return hotspots.sort((a, b) => b.hotScore - a.hotScore);
}
