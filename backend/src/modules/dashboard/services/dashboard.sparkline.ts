import prisma from '../../../config/db';

export interface SparklinePoint {
  date: string;
  count: number;
}

export interface SparklineData {
  id: string;
  points: number[]; // 7 numbers representing the last 7 days
  growth: number;   // growth % compared to the preceding 7 days
}

export async function getSparklineTrends(type: 'posts' | 'destinations' | 'users', ids: string[]): Promise<Record<string, SparklineData>> {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const results: Record<string, SparklineData> = {};

  // Initialize empty sparkline data for each ID
  ids.forEach(id => {
    results[id] = { id, points: [0, 0, 0, 0, 0, 0, 0], growth: 0 };
  });

  if (ids.length === 0) return results;

  // Helper to map Date to index (0 to 6 for last 7 days, or -1 for older)
  const getDayIndex = (date: Date): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // We want index 0 to represent 6 days ago, and index 6 to represent today
    const index = 6 - diffDays;
    return (index >= 0 && index <= 6) ? index : -1;
  };

  const getPrecedingDayIndex = (date: Date): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Preceding 7 days: 7 to 13 days ago
    const index = 13 - diffDays;
    return (index >= 0 && index <= 6) ? index : -1;
  };

  if (type === 'posts') {
    // Collect likes and comments for the target post IDs in the last 14 days
    const [likes, comments] = await Promise.all([
      prisma.like.findMany({
        where: { postId: { in: ids }, createdAt: { gte: fourteenDaysAgo } },
        select: { postId: true, createdAt: true }
      }),
      prisma.comment.findMany({
        where: { postId: { in: ids }, createdAt: { gte: fourteenDaysAgo } },
        select: { postId: true, createdAt: true }
      })
    ]);

    const postActivityMap: Record<string, { current: number[]; preceding: number[] }> = {};
    ids.forEach(id => {
      postActivityMap[id] = {
        current: [0, 0, 0, 0, 0, 0, 0],
        preceding: [0, 0, 0, 0, 0, 0, 0]
      };
    });

    // Populate current and preceding arrays
    likes.forEach(like => {
      const idx = getDayIndex(like.createdAt);
      if (idx !== -1) postActivityMap[like.postId].current[idx]++;
      
      const pIdx = getPrecedingDayIndex(like.createdAt);
      if (pIdx !== -1) postActivityMap[like.postId].preceding[pIdx]++;
    });

    comments.forEach(comment => {
      if (comment.postId) {
        const idx = getDayIndex(comment.createdAt);
        if (idx !== -1) postActivityMap[comment.postId].current[idx]++;
        
        const pIdx = getPrecedingDayIndex(comment.createdAt);
        if (pIdx !== -1) postActivityMap[comment.postId].preceding[pIdx]++;
      }
    });

    ids.forEach(id => {
      const activity = postActivityMap[id];
      const sumCurrent = activity.current.reduce((a, b) => a + b, 0);
      const sumPreceding = activity.preceding.reduce((a, b) => a + b, 0);
      
      let growth = 0;
      if (sumPreceding > 0) {
        growth = Math.round(((sumCurrent - sumPreceding) / sumPreceding) * 100);
      } else if (sumCurrent > 0) {
        growth = 100;
      }

      results[id] = { id, points: activity.current, growth };
    });

  } else if (type === 'destinations') {
    // Collect checkins for destinations in the last 14 days
    const checkins = await prisma.checkIn.findMany({
      where: { destinationId: { in: ids }, createdAt: { gte: fourteenDaysAgo } },
      select: { destinationId: true, createdAt: true }
    });

    const destActivityMap: Record<string, { current: number[]; preceding: number[] }> = {};
    ids.forEach(id => {
      destActivityMap[id] = {
        current: [0, 0, 0, 0, 0, 0, 0],
        preceding: [0, 0, 0, 0, 0, 0, 0]
      };
    });

    checkins.forEach(c => {
      const idx = getDayIndex(c.createdAt);
      if (idx !== -1) destActivityMap[c.destinationId].current[idx]++;
      
      const pIdx = getPrecedingDayIndex(c.createdAt);
      if (pIdx !== -1) destActivityMap[c.destinationId].preceding[pIdx]++;
    });

    ids.forEach(id => {
      const activity = destActivityMap[id];
      const sumCurrent = activity.current.reduce((a, b) => a + b, 0);
      const sumPreceding = activity.preceding.reduce((a, b) => a + b, 0);
      
      let growth = 0;
      if (sumPreceding > 0) {
        growth = Math.round(((sumCurrent - sumPreceding) / sumPreceding) * 100);
      } else if (sumCurrent > 0) {
        growth = 100;
      }

      results[id] = { id, points: activity.current, growth };
    });

  } else if (type === 'users') {
    // Collect posts created by top users in the last 14 days
    const posts = await prisma.post.findMany({
      where: { authorId: { in: ids }, deletedAt: null, createdAt: { gte: fourteenDaysAgo } },
      select: { authorId: true, createdAt: true }
    });

    const userActivityMap: Record<string, { current: number[]; preceding: number[] }> = {};
    ids.forEach(id => {
      userActivityMap[id] = {
        current: [0, 0, 0, 0, 0, 0, 0],
        preceding: [0, 0, 0, 0, 0, 0, 0]
      };
    });

    posts.forEach(p => {
      const idx = getDayIndex(p.createdAt);
      if (idx !== -1) userActivityMap[p.authorId].current[idx]++;
      
      const pIdx = getPrecedingDayIndex(p.createdAt);
      if (pIdx !== -1) userActivityMap[p.authorId].preceding[pIdx]++;
    });

    ids.forEach(id => {
      const activity = userActivityMap[id];
      const sumCurrent = activity.current.reduce((a, b) => a + b, 0);
      const sumPreceding = activity.preceding.reduce((a, b) => a + b, 0);
      
      let growth = 0;
      if (sumPreceding > 0) {
        growth = Math.round(((sumCurrent - sumPreceding) / sumPreceding) * 100);
      } else if (sumCurrent > 0) {
        growth = 100;
      }

      results[id] = { id, points: activity.current, growth };
    });
  }

  return results;
}
