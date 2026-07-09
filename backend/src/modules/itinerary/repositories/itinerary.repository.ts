import prisma from '../../../config/db';
import { AddActivityDto, UpdateActivityDto } from '../types/itinerary.types';

export class ItineraryRepository {
  // ─── Itinerary ──────────────────────────────────────────────
  async createItinerary(userId: string, title: string, description?: string) {
    return prisma.itinerary.create({
      data: {
        userId,
        title,
        description: description || null,
      },
    });
  }

  async getItinerariesByUserId(userId: string) {
    return prisma.itinerary.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { days: true },
        },
      },
    });
  }

  async getItineraryById(id: string, userId: string) {
    return prisma.itinerary.findFirst({
      where: { id, userId },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            activities: {
              orderBy: { startTime: 'asc' },
            },
          },
        },
      },
    });
  }

  // ─── Itinerary Day ──────────────────────────────────────────
  async addDay(itineraryId: string, dayIndex: number, date?: Date) {
    return prisma.itineraryDay.create({
      data: {
        itineraryId,
        dayIndex,
        date: date || null,
      },
    });
  }

  async getDayById(dayId: string) {
    return prisma.itineraryDay.findUnique({
      where: { id: dayId },
      include: {
        itinerary: true,
      },
    });
  }

  // ─── Itinerary Activity ─────────────────────────────────────
  async addActivity(itineraryDayId: string, data: AddActivityDto) {
    return prisma.itineraryActivity.create({
      data: {
        itineraryDayId,
        title: data.title,
        description: data.description || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        cost: data.cost ?? 0.0,
      },
    });
  }

  async getActivityById(activityId: string) {
    return prisma.itineraryActivity.findUnique({
      where: { id: activityId },
      include: {
        day: {
          include: {
            itinerary: true,
          },
        },
      },
    });
  }

  async updateActivity(activityId: string, data: UpdateActivityDto) {
    return prisma.itineraryActivity.update({
      where: { id: activityId },
      data: {
        title: data.title ?? undefined,
        description: data.description !== undefined ? data.description : undefined,
        startTime: data.startTime !== undefined ? data.startTime : undefined,
        endTime: data.endTime !== undefined ? data.endTime : undefined,
        location: data.location !== undefined ? data.location : undefined,
        cost: data.cost ?? undefined,
      },
    });
  }

  async deleteActivity(activityId: string) {
    return prisma.itineraryActivity.delete({
      where: { id: activityId },
    });
  }
}
