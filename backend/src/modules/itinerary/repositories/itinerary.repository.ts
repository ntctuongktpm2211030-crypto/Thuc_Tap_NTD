import prisma from '../../../config/db';
import { AddActivityDto, UpdateActivityDto } from '../types/itinerary.types';

export class ItineraryRepository {
  // ─── Itinerary ──────────────────────────────────────────────
  async createItinerary(userId: string, title: string, description?: string) {
    return prisma.trip.create({
      data: {
        ownerId: userId,
        title,
        description: description || null,
        destinationName: 'Chưa xác định',
        travelStyle: 'solo',
        status: 'DRAFT_USER',
      },
    });
  }

  async getItinerariesByUserId(userId: string) {
    const list = await prisma.trip.findMany({
      where: { ownerId: userId, status: { in: ['DRAFT_AI', 'DRAFT_USER'] } },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { days: true },
        },
      },
    });
    return list.map(item => ({
      ...item,
      userId: item.ownerId,
    }));
  }

  async getItineraryById(id: string, userId: string) {
    const trip = await prisma.trip.findFirst({
      where: { id, ownerId: userId, status: { in: ['DRAFT_AI', 'DRAFT_USER'] } },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            activities: {
              orderBy: { sequenceOrder: 'asc' },
            },
          },
        },
      },
    });
    if (!trip) return null;

    return {
      ...trip,
      userId: trip.ownerId,
      days: trip.days.map(d => ({
        ...d,
        itineraryId: d.tripId,
        activities: d.activities.map(a => ({
          ...a,
          itineraryDayId: a.tripDayId,
          cost: a.estimatedCost,
        })),
      })),
    };
  }

  // ─── Itinerary Day ──────────────────────────────────────────
  async addDay(itineraryId: string, dayIndex: number, date?: Date) {
    const day = await prisma.tripDay.create({
      data: {
        tripId: itineraryId,
        dayIndex,
        date: date || null,
      },
    });
    return {
      ...day,
      itineraryId: day.tripId,
    };
  }

  async getDayById(dayId: string) {
    const day = await prisma.tripDay.findUnique({
      where: { id: dayId },
      include: {
        trip: true,
      },
    });
    if (!day) return null;

    return {
      ...day,
      itineraryId: day.tripId,
      itinerary: {
        ...day.trip,
        userId: day.trip.ownerId,
      },
    };
  }

  // ─── Itinerary Activity ─────────────────────────────────────
  async addActivity(itineraryDayId: string, data: AddActivityDto) {
    const act = await prisma.tripActivity.create({
      data: {
        tripDayId: itineraryDayId,
        title: data.title,
        description: data.description || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        estimatedCost: data.cost ?? 0.0,
        sequenceOrder: 1,
      },
    });
    return {
      ...act,
      itineraryDayId: act.tripDayId,
      cost: act.estimatedCost,
    };
  }

  async getActivityById(activityId: string) {
    const act = await prisma.tripActivity.findUnique({
      where: { id: activityId },
      include: {
        tripDay: {
          include: {
            trip: true,
          },
        },
      },
    });
    if (!act) return null;

    return {
      ...act,
      cost: act.estimatedCost,
      day: {
        ...act.tripDay,
        itineraryId: act.tripDay.tripId,
        itinerary: {
          ...act.tripDay.trip,
          userId: act.tripDay.trip.ownerId,
        },
      },
    };
  }

  async updateActivity(activityId: string, data: UpdateActivityDto) {
    const act = await prisma.tripActivity.update({
      where: { id: activityId },
      data: {
        title: data.title ?? undefined,
        description: data.description !== undefined ? data.description : undefined,
        startTime: data.startTime !== undefined ? data.startTime : undefined,
        endTime: data.endTime !== undefined ? data.endTime : undefined,
        location: data.location !== undefined ? data.location : undefined,
        estimatedCost: data.cost ?? undefined,
      },
    });
    return {
      ...act,
      itineraryDayId: act.tripDayId,
      cost: act.estimatedCost,
    };
  }

  async deleteActivity(activityId: string) {
    return prisma.tripActivity.delete({
      where: { id: activityId },
    });
  }
}
