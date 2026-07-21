import prisma from '../../../config/db';

export interface DrilldownResult {
  type: string;
  id: string;
  metadata: any;
  items: any[];
  totalCount: number;
  page: number;
  limit: number;
}

export async function getDrilldownData(
  type: 'province' | 'post' | 'user' | 'destination',
  id: string,
  page: number = 1,
  limit: number = 10,
  q?: string
): Promise<DrilldownResult> {
  const offset = (page - 1) * limit;
  let items: any[] = [];
  let totalCount = 0;
  let metadata: any = {};

  const querySearch = q ? q.trim().toLowerCase() : '';

  if (type === 'user') {
    // User details and their posts
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });

    if (user) {
      metadata = {
        name: user.name,
        email: user.email,
        avatar: user.profile?.avatarUrl || '',
        bio: user.profile?.bio || ''
      };

      const whereClause: any = { authorId: id, deletedAt: null };
      if (querySearch) {
        whereClause.content = { contains: querySearch, mode: 'insensitive' };
      }

      [items, totalCount] = await Promise.all([
        prisma.post.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: { _count: { select: { likes: true, comments: true } } }
        }),
        prisma.post.count({ where: whereClause })
      ]);
    }

  } else if (type === 'post') {
    // Post details and its comments
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { include: { profile: true } } }
    });

    if (post) {
      metadata = {
        authorName: post.author.name,
        content: post.content,
        mediaUrls: post.mediaUrls,
        createdAt: post.createdAt
      };

      const whereClause: any = { postId: id };
      if (querySearch) {
        whereClause.content = { contains: querySearch, mode: 'insensitive' };
      }

      [items, totalCount] = await Promise.all([
        prisma.comment.findMany({
          where: whereClause,
          orderBy: { createdAt: 'asc' },
          skip: offset,
          take: limit,
          include: { author: { select: { name: true } } }
        }),
        prisma.comment.count({ where: whereClause })
      ]);
    }

  } else if (type === 'destination') {
    // Destination details and checkins
    const dest = await prisma.destination.findUnique({
      where: { id }
    });

    if (dest) {
      metadata = {
        name: dest.name,
        category: dest.category,
        address: dest.address || '',
        averageRating: dest.averageRating
      };

      const whereClause: any = { destinationId: id };
      if (querySearch) {
        whereClause.user = { name: { contains: querySearch, mode: 'insensitive' } };
      }

      [items, totalCount] = await Promise.all([
        prisma.checkIn.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: { user: { select: { name: true } } }
        }),
        prisma.checkIn.count({ where: whereClause })
      ]);
    }

  } else if (type === 'province') {
    // Find all checkins in locations matching the province address string
    metadata = { province: id };

    const whereClause: any = {
      destination: {
        address: { contains: id, mode: 'insensitive' }
      }
    };

    if (querySearch) {
      whereClause.destination.name = { contains: querySearch, mode: 'insensitive' };
    }

    [items, totalCount] = await Promise.all([
      prisma.checkIn.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: { select: { name: true } },
          destination: { select: { name: true, address: true } }
        }
      }),
      prisma.checkIn.count({ where: whereClause })
    ]);
  }

  return {
    type,
    id,
    metadata,
    items,
    totalCount,
    page,
    limit
  };
}
