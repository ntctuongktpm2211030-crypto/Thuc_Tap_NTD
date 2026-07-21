import prisma from '../../../config/db';
import { getComparisonRanges } from './date-utils';

export interface ComparisonCard {
  label: string;
  current: number;
  previous: number;
  percentageChange: number;
  direction: 'up' | 'down' | 'neutral';
  color: 'green' | 'red' | 'gray';
  tooltip: string;
}

export async function getPeriodComparison(filter: string) {
  const { currentStart, currentEnd, previousStart, previousEnd, label } = getComparisonRanges(filter);

  const [
    currUsers, prevUsers,
    currPosts, prevPosts,
    currLikes, prevLikes,
    currReviews, prevReviews,
    currCheckins, prevCheckins,
    currSearches, prevSearches
  ] = await Promise.all([
    // Users
    prisma.user.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.user.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
    // Posts
    prisma.post.count({ where: { createdAt: { gte: currentStart, lte: currentEnd }, deletedAt: null } }),
    prisma.post.count({ where: { createdAt: { gte: previousStart, lte: previousEnd }, deletedAt: null } }),
    // Likes
    prisma.like.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.like.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
    // Reviews (TravelHistory with ratings)
    prisma.travelHistory.count({ where: { createdAt: { gte: currentStart, lte: currentEnd }, rating: { not: null } } }),
    prisma.travelHistory.count({ where: { createdAt: { gte: previousStart, lte: previousEnd }, rating: { not: null } } }),
    // Checkins
    prisma.checkIn.count({ where: { createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.checkIn.count({ where: { createdAt: { gte: previousStart, lte: previousEnd } } }),
    // Searches (sum from SearchStatistics or cache fallback)
    prisma.searchStatistics.aggregate({
      _sum: { searchCount: true },
      where: { date: { gte: currentStart, lte: currentEnd } }
    }),
    prisma.searchStatistics.aggregate({
      _sum: { searchCount: true },
      where: { date: { gte: previousStart, lte: previousEnd } }
    })
  ]);

  const currSearchCount = currSearches._sum.searchCount || 0;
  const prevSearchCount = prevSearches._sum.searchCount || 0;

  const makeCard = (cardTitle: string, current: number, previous: number, metricName: string): ComparisonCard => {
    let percentageChange = 0;
    if (previous > 0) {
      percentageChange = Math.round(((current - previous) / previous) * 100);
    } else if (current > 0) {
      percentageChange = 100; // 100% growth from 0 baseline
    }

    const direction = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral';
    const color = percentageChange > 0 ? 'green' : percentageChange < 0 ? 'red' : 'gray';
    const absPercent = Math.abs(percentageChange);
    const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';

    return {
      label: `${cardTitle} ${label}`,
      current,
      previous,
      percentageChange: absPercent,
      direction,
      color,
      tooltip: `Tính bằng công thức: ((Hiện tại [${current}] - Kỳ trước [${previous}]) / Kỳ trước [${previous}]) * 100. So sánh lượng phát sinh mới của chỉ số ${metricName} giữa hai khoảng thời gian bằng nhau.`,
    };
  };

  return {
    users: makeCard('Người dùng mới', currUsers, prevUsers, 'người dùng'),
    posts: makeCard('Bài đăng mới', currPosts, prevPosts, 'bài đăng'),
    likes: makeCard('Lượt thích mới', currLikes, prevLikes, 'thích'),
    reviews: makeCard('Đánh giá mới', currReviews, prevReviews, 'đánh giá'),
    checkins: makeCard('Lượt check-in mới', currCheckins, prevCheckins, 'check-in'),
    searches: makeCard('Lượt tìm kiếm mới', currSearchCount, prevSearchCount, 'tìm kiếm')
  };
}
