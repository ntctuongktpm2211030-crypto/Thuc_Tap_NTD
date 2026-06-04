export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isVerified: boolean;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
}

export interface Destination {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category: 'restaurant' | 'hotel' | 'attraction';
  averageRating: number;
}

export interface TripActivity {
  id: string;
  tripDayId: string;
  destinationId: string;
  destination: Destination;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  estimatedCost: number;
  sequenceOrder: number;
  notes?: string;
}

export interface TripDay {
  id: string;
  tripId: string;
  dayIndex: number;
  date: string;
  activities: TripActivity[];
}

export interface Trip {
  id: string;
  ownerId: string;
  title: string;
  destinationName: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  travelStyle: string;
  isPublic: boolean;
  days?: TripDay[];
}
