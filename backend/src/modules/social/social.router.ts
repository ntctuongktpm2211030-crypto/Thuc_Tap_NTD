import { Router, Response } from 'express';
import prisma from '../../config/db';
import { requireAuth, AuthRequest } from '../auth/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────────────────
// GET /api/v1/social/profile/:userId
// ─────────────────────────────────────────────────────────
router.get('/profile/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        profile: true,
        preferences: true,
        _count: {
          select: {
            posts: true,
            trips: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Don't expose sensitive fields
    const { passwordHash, verificationToken, resetPasswordToken, ...safeUser } = user as any;
    return res.json(safeUser);
  } catch (err) {
    console.error('[social/profile GET]', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/social/profile  — update own profile
// ─────────────────────────────────────────────────────────
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, bio, avatarUrl, homeLocation, phoneNumber } = req.body;

    const updated = await prisma.profile.update({
      where: { userId: req.user!.sub },
      data: {
        fullName: fullName ?? undefined,
        bio: bio ?? undefined,
        avatarUrl: avatarUrl ?? undefined,
        homeLocation: homeLocation ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('[social/profile PUT]', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/social/follow/:targetUserId  — follow / unfollow toggle
// ─────────────────────────────────────────────────────────
router.post('/follow/:targetUserId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user!.sub;
    const followingId = req.params.targetUserId;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself.' });
    }

    const existing = await prisma.follower.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      // Unfollow
      await prisma.follower.delete({
        where: { followerId_followingId: { followerId, followingId } },
      });
      return res.json({ following: false });
    } else {
      // Follow + create notification
      await prisma.$transaction([
        prisma.follower.create({ data: { followerId, followingId } }),
        prisma.notification.create({
          data: {
            recipientId: followingId,
            type: 'friend_request',
            content: `Someone started following you!`,
          },
        }),
      ]);
      return res.json({ following: true });
    }
  } catch (err) {
    console.error('[social/follow POST]', err);
    return res.status(500).json({ error: 'Failed to toggle follow.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/social/followers/:userId  — list followers
// ─────────────────────────────────────────────────────────
router.get('/followers/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const followers = await prisma.follower.findMany({
      where: { followingId: req.params.userId },
      include: { follower: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(followers.map((f) => f.follower));
  } catch (err) {
    console.error('[social/followers GET]', err);
    return res.status(500).json({ error: 'Failed to fetch followers.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/social/following/:userId  — list following
// ─────────────────────────────────────────────────────────
router.get('/following/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const following = await prisma.follower.findMany({
      where: { followerId: req.params.userId },
      include: { following: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(following.map((f) => f.following));
  } catch (err) {
    console.error('[social/following GET]', err);
    return res.status(500).json({ error: 'Failed to fetch following.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/social/notifications  — own notifications
// ─────────────────────────────────────────────────────────
router.get('/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return res.json(notifications);
  } catch (err) {
    console.error('[social/notifications GET]', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/social/notifications/read-all  — mark all as read
// ─────────────────────────────────────────────────────────
router.put('/notifications/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user!.sub, isRead: false },
      data: { isRead: true },
    });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('[social/notifications PUT]', err);
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// ─────────────────────────────────────────────────────────
// PUT /api/v1/social/preferences  — save travel preferences
// ─────────────────────────────────────────────────────────
router.put('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { preferredPace, dailyBudget, activities, destinationTypes, foodPreferences } = req.body;

    const preferences = await prisma.travelPreferences.upsert({
      where: { userId: req.user!.sub },
      create: {
        userId: req.user!.sub,
        preferredPace: preferredPace || 'moderate',
        dailyBudget: dailyBudget || 100,
        activities: activities || [],
        destinationTypes: destinationTypes || [],
        foodPreferences: foodPreferences || [],
      },
      update: {
        preferredPace: preferredPace ?? undefined,
        dailyBudget: dailyBudget ?? undefined,
        activities: activities ?? undefined,
        destinationTypes: destinationTypes ?? undefined,
        foodPreferences: foodPreferences ?? undefined,
      },
    });

    return res.json(preferences);
  } catch (err) {
    console.error('[social/preferences PUT]', err);
    return res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/social/search?q=  — search users by name/email
// ─────────────────────────────────────────────────────────
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = '10' } = req.query as Record<string, string>;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { profile: { fullName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { profile: true, _count: { select: { posts: true, followers: true } } },
      take: Number(limit),
    });

    return res.json(users.map(({ passwordHash, verificationToken, resetPasswordToken, ...u }: any) => u));
  } catch (err) {
    console.error('[social/search GET]', err);
    return res.status(500).json({ error: 'Search failed.' });
  }
});

export default router;
