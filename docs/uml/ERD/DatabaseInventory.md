# SmartTravel Database Inventory

This document provides a comprehensive inventory of the database models, fields, enums, relationships, unique constraints, and indexes reverse-engineered from the Prisma database schema in [schema.prisma](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma).

---

## 1. Database Enums

### `UserRole`
Defines role-based privileges within the application.
* **Values**:
  * `USER` (Default role for standard travelers)
  * `ADMIN` (Administrative role)

---

## 2. Entities & Models Inventory

### User (`User`)
Represents user profiles, credentials, and central references.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `email`: `String` (Unique, index-optimized)
  * `passwordHash`: `String` (Bcrypt encrypted)
  * `role`: `UserRole` (Enum, default: `USER`)
  * `isVerified`: `Boolean` (default: `false`)
  * `verificationToken`: `String?`
  * `resetPasswordToken`: `String?`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([email])`
* **Relationships**:
  * `profile`: `Profile?` (1-to-1, mapped by `Profile.userId`)
  * `preferences`: `TravelPreferences?` (1-to-1, mapped by `TravelPreferences.userId`)
  * `trips`: `Trip[]` (1-to-many, mapped by `Trip.ownerId`)
  * `posts`: `Post[]` (1-to-many, mapped by `Post.authorId`)
  * `comments`: `Comment[]` (1-to-many, mapped by `Comment.authorId`)
  * `likes`: `Like[]` (1-to-many, mapped by `Like.userId`)
  * `bookmarks`: `Bookmark[]` (1-to-many, mapped by `Bookmark.userId`)
  * `checkIns`: `CheckIn[]` (1-to-many, mapped by `CheckIn.userId`)
  * `notifications`: `Notification[]` (1-to-many, mapped by `Notification.recipientId`)
  * `aiHistories`: `AIHistory[]` (1-to-many, mapped by `AIHistory.userId`)
  * `liveLocation`: `Location?` (1-to-1, mapped by `Location.userId`)
  * `chatbotConversations`: `ChatConversation[]` (1-to-many, mapped by `ChatConversation.userId`)
  * `aiMemory`: `AIMemory?` (1-to-1, mapped by `AIMemory.userId`)
  * `itineraries`: `Itinerary[]` (1-to-many, mapped by `Itinerary.userId`)
  * `userRecommendations`: `UserRecommendation[]` (1-to-many, mapped by `UserRecommendation.userId`)
  * `travelHistories`: `TravelHistory[]` (1-to-many, mapped by `TravelHistory.userId`)
  * `favoriteFoods`: `FavoriteFood[]` (1-to-many, mapped by `FavoriteFood.userId`)
  * `savedPlaces`: `SavedPlace[]` (1-to-many, mapped by `SavedPlace.userId`)
  * `aiFeedbacks`: `AIFeedback[]` (1-to-many, mapped by `AIFeedback.userId`)
  * `followers`: `Follower[]` (1-to-many self-relation "Following", mapped by `Follower.followingId`)
  * `following`: `Follower[]` (1-to-many self-relation "Follower", mapped by `Follower.followerId`)
  * `conversations`: `Conversation[]` (many-to-many, mapped through relation table `ConversationParticipants`)
  * `messages`: `Message[]` (1-to-many, mapped by `Message.senderId`)
  * `journeys`: `Journey[]` (1-to-many, mapped by `Journey.userId`)
  * `locationHistory`: `LocationHistory[]` (1-to-many, mapped by `LocationHistory.userId`)
  * `organizedEvents`: `Event[]` (1-to-many, mapped by `Event.organizerId`)
  * `eventAttendances`: `EventAttendee[]` (1-to-many, mapped by `EventAttendee.userId`)
  * `travelerMatchesUser`: `TravelerMatch[]` (1-to-many compatibility source, mapped by `TravelerMatch.userId`)
  * `travelerMatchesTarget`: `TravelerMatch[]` (1-to-many compatibility target, mapped by `TravelerMatch.matchedUserId`)

---

### Profile (`Profile`)
Stores user personal info.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Unique, Foreign Key referring to `User.id`)
  * `fullName`: `String`
  * `avatarUrl`: `String?`
  * `coverUrl`: `String?`
  * `bio`: `String?`
  * `phoneNumber`: `String?`
  * `homeLocation`: `String?`
* **Relationships**:
  * `user`: `User` (1-to-1, links `userId` -> `User.id`, `onDelete: Cascade`)

---

### Travel Preferences (`TravelPreferences`)
Defines traveler attributes for recommendation scoring.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Unique, Foreign Key referring to `User.id`)
  * `preferredPace`: `String` ("slow", "moderate", "fast")
  * `dailyBudget`: `Float`
  * `activities`: `String[]` (Interest categories)
  * `destinationTypes`: `String[]`
  * `foodPreferences`: `String[]`
* **Relationships**:
  * `user`: `User` (1-to-1, links `userId` -> `User.id`, `onDelete: Cascade`)

---

### Trip (`Trip`)
Travel logs containing planner outlines.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `ownerId`: `String` (Foreign Key referring to `User.id`)
  * `title`: `String`
  * `description`: `String?`
  * `destinationName`: `String`
  * `startDate`: `DateTime`
  * `endDate`: `DateTime`
  * `totalBudget`: `Float`
  * `travelStyle`: `String` ("solo", "family", "friends", "couple")
  * `isPublic`: `Boolean` (default: `false`)
  * `cloneSourceId`: `String?` (Foreign Key referring to `Trip.id` self-relation)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([ownerId])`
  * `@@index([cloneSourceId])`
* **Relationships**:
  * `owner`: `User` (references `ownerId` -> `User.id`, `onDelete: Cascade`)
  * `cloneSource`: `Trip?` (references `cloneSourceId` -> `Trip.id`)
  * `clonedTrips`: `Trip[]` (Self-relation, mapped by child trips)
  * `days`: `TripDay[]` (1-to-many, mapped by `TripDay.tripId`)
  * `posts`: `Post[]` (1-to-many, mapped by `Post.tripId`)
  * `recommendations`: `Recommendation[]` (1-to-many, mapped by `Recommendation.tripId`)

---

### Trip Day (`TripDay`)
Calculates coordinates and lists activities for individual dates of a Trip.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `tripId`: `String` (Foreign Key referring to `Trip.id`)
  * `dayIndex`: `Int` (Day number, e.g. 1, 2)
  * `date`: `DateTime`
* **Unique Constraints**:
  * `@@unique([tripId, dayIndex])` (Prevents duplicate days inside the same trip)
* **Relationships**:
  * `trip`: `Trip` (references `tripId` -> `Trip.id`, `onDelete: Cascade`)
  * `activities`: `TripActivity[]` (1-to-many, mapped by `TripActivity.tripDayId`)

---

### Trip Activity (`TripActivity`)
Timeline items mapped on a TripDay.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `tripDayId`: `String` (Foreign Key referring to `TripDay.id`)
  * `destinationId`: `String` (Foreign Key referring to `Destination.id`)
  * `startTime`: `String` ("HH:MM" format)
  * `endTime`: `String` ("HH:MM" format)
  * `estimatedCost`: `Float` (default: `0.0`)
  * `sequenceOrder`: `Int`
  * `notes`: `String?` (Serialized JSON string holding additional properties)
* **Indexes**:
  * `@@index([tripDayId])`
  * `@@index([destinationId])`
* **Relationships**:
  * `tripDay`: `TripDay` (references `tripDayId` -> `TripDay.id`, `onDelete: Cascade`)
  * `destination`: `Destination` (references `destinationId` -> `Destination.id`)

---

### Destination (`Destination`)
Spatial coordinates and details of spots.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `name`: `String`
  * `description`: `String?`
  * `latitude`: `Float` (Geographic latitude)
  * `longitude`: `Float` (Geographic longitude)
  * `category`: `String` ("restaurant", "hotel", "attraction", etc.)
  * `averageRating`: `Float` (default: `0.0`)
  * `address`: `String?`
  * `openingHours`: `String?`
* **Indexes**:
  * `@@index([latitude, longitude])` (Speeds up spatial/bounding-box queries)
* **Relationships**:
  * `activities`: `TripActivity[]` (1-to-many, mapped by `TripActivity.destinationId`)
  * `checkIns`: `CheckIn[]` (1-to-many, mapped by `CheckIn.destinationId`)
  * `recommendations`: `Recommendation[]` (1-to-many, mapped by `Recommendation.destinationId`)
  * `events`: `Event[]` (1-to-many, mapped by `Event.destinationId`)

---

### Post (`Post`)
Social media blog feed.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `authorId`: `String` (Foreign Key referring to `User.id`)
  * `content`: `String`
  * `mediaUrls`: `String[]`
  * `tripId`: `String?` (Foreign Key referring to `Trip.id`)
  * `locationId`: `String?`
  * `createdAt`: `DateTime` (default: `now()`)
  * `deletedAt`: `DateTime?`
* **Indexes**:
  * `@@index([authorId])`
  * `@@index([tripId])`
* **Relationships**:
  * `author`: `User` (references `authorId` -> `User.id`, `onDelete: Cascade`)
  * `trip`: `Trip?` (references `tripId` -> `Trip.id`, `onDelete: SetNull`)
  * `comments`: `Comment[]` (1-to-many, mapped by `Comment.postId`)
  * `likes`: `Like[]` (1-to-many, mapped by `Like.postId`)
  * `bookmarks`: `Bookmark[]` (1-to-many, mapped by `Bookmark.postId`)

---

### Comment (`Comment`)
Post responses support threads.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `postId`: `String` (Foreign Key referring to `Post.id`)
  * `authorId`: `String` (Foreign Key referring to `User.id`)
  * `content`: `String`
  * `parentId`: `String?` (Foreign Key referring to self-relation `Comment.id`)
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([postId])`
  * `@@index([authorId])`
  * `@@index([parentId])`
* **Relationships**:
  * `post`: `Post` (references `postId` -> `Post.id`, `onDelete: Cascade`)
  * `author`: `User` (references `authorId` -> `User.id`, `onDelete: Cascade`)
  * `parent`: `Comment?` (references `parentId` -> `Comment.id`, `onDelete: Cascade`)
  * `replies`: `Comment[]` (Self-relation, mapped by child comments)

---

### Like (`Like`)
Blog posts like relation.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `postId`: `String` (Foreign Key referring to `Post.id`)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `createdAt`: `DateTime` (default: `now()`)
* **Unique Constraints**:
  * `@@unique([postId, userId])` (Enforces one like per post per user)
* **Relationships**:
  * `post`: `Post` (references `postId` -> `Post.id`, `onDelete: Cascade`)
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Bookmark (`Bookmark`)
Blog posts saved list relation.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `postId`: `String` (Foreign Key referring to `Post.id`)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `createdAt`: `DateTime` (default: `now()`)
* **Unique Constraints**:
  * `@@unique([postId, userId])` (Enforces one bookmark per post per user)
* **Relationships**:
  * `post`: `Post` (references `postId` -> `Post.id`, `onDelete: Cascade`)
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Follower (`Follower`)
Social follower networks.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `followerId`: `String` (Foreign Key referring to `User.id`)
  * `followingId`: `String` (Foreign Key referring to `User.id`)
  * `createdAt`: `DateTime` (default: `now()`)
* **Unique Constraints**:
  * `@@unique([followerId, followingId])`
* **Relationships**:
  * `follower`: `User` (references `followerId` -> `User.id`, relation: "Follower", `onDelete: Cascade`)
  * `following`: `User` (references `followingId` -> `User.id`, relation: "Following", `onDelete: Cascade`)

---

### Message (`Message`)
Peer-to-peer chat text history.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `conversationId`: `String` (Foreign Key referring to `Conversation.id`)
  * `senderId`: `String` (Foreign Key referring to `User.id`)
  * `content`: `String`
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([conversationId])`
* **Relationships**:
  * `conversation`: `Conversation` (references `conversationId` -> `Conversation.id`, `onDelete: Cascade`)
  * `sender`: `User` (references `senderId` -> `User.id`, `onDelete: Cascade`)

---

### Conversation (`Conversation`)
Chat rooms linking participants.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Relationships**:
  * `participants`: `User[]` (Many-to-many connection, mapped through relation table `ConversationParticipants`)
  * `messages`: `Message[]` (1-to-many, mapped by `Message.conversationId`)

---

### Notification (`Notification`)
Alerts triggered on social activity.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `recipientId`: `String` (Foreign Key referring to `User.id`)
  * `type`: `String` ("like", "comment", "friend_request", "invitation")
  * `content`: `String`
  * `isRead`: `Boolean` (default: `false`)
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([recipientId])`
* **Relationships**:
  * `recipient`: `User` (references `recipientId` -> `User.id`, `onDelete: Cascade`)

---

### CheckIn (`CheckIn`)
Travel map pins.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `destinationId`: `String` (Foreign Key referring to `Destination.id`)
  * `note`: `String?`
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([userId])`
  * `@@index([destinationId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)
  * `destination`: `Destination` (references `destinationId` -> `Destination.id`, `onDelete: Cascade`)

---

### Location (`Location`)
User current coordinates.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Unique, Foreign Key referring to `User.id`)
  * `latitude`: `Float`
  * `longitude`: `Float`
  * `updatedAt`: `DateTime` (automatically updated)
* **Relationships**:
  * `user`: `User` (1-to-1, links `userId` -> `User.id`, relation: "UserLiveLocation", `onDelete: Cascade`)

---

### Recommendation (`Recommendation`)
Scored catalog suggestions mapped to a Trip.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `tripId`: `String` (Foreign Key referring to `Trip.id`)
  * `destinationId`: `String` (Foreign Key referring to `Destination.id`)
  * `score`: `Float` (Content rating matching score `0.0 - 1.0`)
  * `recommendationReason`: `String?`
* **Indexes**:
  * `@@index([tripId])`
* **Relationships**:
  * `trip`: `Trip` (references `tripId` -> `Trip.id`, `onDelete: Cascade`)
  * `destination`: `Destination` (references `destinationId` -> `Destination.id`, `onDelete: Cascade`)

---

### AI History (`AIHistory`)
Log audit for LLM outputs.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `promptText`: `String`
  * `responseJson`: `String`
  * `type`: `String` ("itinerary", "cost_prediction", "route_optimization")
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([userId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Journey (`Journey`)
Travel story diaries.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `title`: `String`
  * `description`: `String?`
  * `coverImageUrl`: `String?`
  * `isPublic`: `Boolean` (default: `true`)
  * `status`: `String` (default: "draft", supports: "draft", "active", "completed")
  * `startDate`: `DateTime?`
  * `endDate`: `DateTime?`
  * `totalDistance`: `Float` (default: `0`)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
  * `@@index([status])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)
  * `routes`: `Route[]` (1-to-many, mapped by `Route.journeyId`)

---

### Route (`Route`)
Visual route paths drawn on maps inside a Journey.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `journeyId`: `String` (Foreign Key referring to `Journey.id`)
  * `name`: `String`
  * `description`: `String?`
  * `transportMode`: `String` (default: "walking", supports: "walking", "driving", "cycling", "transit")
  * `distanceKm`: `Float` (default: `0`)
  * `durationMin`: `Int` (default: `0`)
  * `color`: `String` (default: "#D4A843")
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([journeyId])`
* **Relationships**:
  * `journey`: `Journey` (references `journeyId` -> `Journey.id`, `onDelete: Cascade`)
  * `points`: `RoutePoint[]` (1-to-many, mapped by `RoutePoint.routeId`)

---

### Route Point (`RoutePoint`)
GPS waypoints constructing a Route.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `routeId`: `String` (Foreign Key referring to `Route.id`)
  * `latitude`: `Float`
  * `longitude`: `Float`
  * `altitude`: `Float?`
  * `sequenceOrder`: `Int`
  * `timestamp`: `DateTime` (default: `now()`)
  * `note`: `String?`
  * `photoUrl`: `String?`
* **Indexes**:
  * `@@index([routeId])`
  * `@@index([latitude, longitude])`
* **Relationships**:
  * `route`: `Route` (references `routeId` -> `Route.id`, `onDelete: Cascade`)

---

### Location History (`LocationHistory`)
Historical track coordinates records.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `latitude`: `Float`
  * `longitude`: `Float`
  * `accuracy`: `Float?`
  * `speed`: `Float?`
  * `heading`: `Float?`
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([userId])`
  * `@@index([createdAt])`
  * `@@index([latitude, longitude])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Event (`Event`)
Public local festival and meetup schedules.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `title`: `String`
  * `description`: `String?`
  * `coverImageUrl`: `String?`
  * `destinationId`: `String?` (Foreign Key referring to `Destination.id`)
  * `latitude`: `Float`
  * `longitude`: `Float`
  * `startDate`: `DateTime`
  * `endDate`: `DateTime?`
  * `category`: `String` ("festival", "meetup", "tour", "workshop", "cultural")
  * `maxAttendees`: `Int?`
  * `currentCount`: `Int` (default: `0`)
  * `organizerId`: `String` (Foreign Key referring to `User.id`)
  * `isPublic`: `Boolean` (default: `true`)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([latitude, longitude])`
  * `@@index([startDate])`
  * `@@index([category])`
  * `@@index([organizerId])`
* **Relationships**:
  * `destination`: `Destination?` (references `destinationId` -> `Destination.id`, `onDelete: SetNull`)
  * `organizer`: `User` (references `organizerId` -> `User.id`, relation: "EventOrganizer", `onDelete: Cascade`)
  * `attendees`: `EventAttendee[]` (1-to-many, mapped by `EventAttendee.eventId`)

---

### Event Attendee (`EventAttendee`)
User attendance tracking for Events.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `eventId`: `String` (Foreign Key referring to `Event.id`)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `status`: `String` (default: "going", values: "going", "interested", "maybe")
  * `createdAt`: `DateTime` (default: `now()`)
* **Unique Constraints**:
  * `@@unique([eventId, userId])`
* **Relationships**:
  * `event`: `Event` (references `eventId` -> `Event.id`, `onDelete: Cascade`)
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Traveler Match (`TravelerMatch`)
Social compatibility calculations.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `matchedUserId`: `String` (Foreign Key referring to `User.id`)
  * `compatScore`: `Float`
  * `matchReasons`: `String[]`
  * `status`: `String` (default: "suggested", supports: "suggested", "accepted", "declined")
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Unique Constraints**:
  * `@@unique([userId, matchedUserId])`
* **Indexes**:
  * `@@index([userId])`
  * `@@index([matchedUserId])`
  * `@@index([compatScore])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, relation: "TravelerMatchUser", `onDelete: Cascade`)
  * `matchedUser`: `User` (references `matchedUserId` -> `User.id`, relation: "TravelerMatchTarget", `onDelete: Cascade`)

---

### Chat Conversation (`ChatConversation`)
AI threads.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `title`: `String?` (default: "New Conversation")
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)
  * `messages`: `ChatMessage[]` (1-to-many, mapped by `ChatMessage.conversationId`)

---

### Chat Message (`ChatMessage`)
Thread entries within ChatConversations.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `conversationId`: `String` (Foreign Key referring to `ChatConversation.id`)
  * `role`: `String` ("user", "assistant", "system")
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([conversationId])`
* **Relationships**:
  * `conversation`: `ChatConversation` (references `conversationId` -> `ChatConversation.id`, `onDelete: Cascade`)
  * `versions`: `ChatMessageVersion[]` (1-to-many, mapped by `ChatMessageVersion.messageId`)
  * `feedback`: `AIFeedback?` (1-to-1, mapped by `AIFeedback.messageId`)
  * `toolCalls`: `ToolCall[]` (1-to-many, mapped by `ToolCall.messageId`)

---

### Chat Message Version (`ChatMessageVersion`)
Keeps track of message edits for active sessions.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `messageId`: `String` (Foreign Key referring to `ChatMessage.id`)
  * `content`: `String`
  * `version`: `Int` (Incremental version number)
  * `isActive`: `Boolean` (default: `true`)
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([messageId])`
* **Relationships**:
  * `message`: `ChatMessage` (references `messageId` -> `ChatMessage.id`, `onDelete: Cascade`)

---

### AI Memory (`AIMemory`)
Extracted profile metadata summarizing traveler preferences.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Unique, Foreign Key referring to `User.id`)
  * `travelPreferences`: `String[]` (Tags like "adventure", "resort")
  * `favoriteFoods`: `String[]`
  * `budget`: `String?`
  * `transportation`: `String[]`
  * `favoriteLocations`: `String[]`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Relationships**:
  * `user`: `User` (1-to-1, links `userId` -> `User.id`, `onDelete: Cascade`)

---

### Itinerary (`Itinerary`)
Structured schedule templates.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `title`: `String`
  * `description`: `String?`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)
  * `days`: `ItineraryDay[]` (1-to-many, mapped by `ItineraryDay.itineraryId`)

---

### Itinerary Day (`ItineraryDay`)
Contains activities mapped on a calendar date.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `itineraryId`: `String` (Foreign Key referring to `Itinerary.id`)
  * `dayIndex`: `Int`
  * `date`: `DateTime?`
* **Indexes**:
  * `@@index([itineraryId])`
* **Relationships**:
  * `itinerary`: `Itinerary` (references `itineraryId` -> `Itinerary.id`, `onDelete: Cascade`)
  * `activities`: `ItineraryActivity[]` (1-to-many, mapped by `ItineraryActivity.itineraryDayId`)

---

### Itinerary Activity (`ItineraryActivity`)
Activity schedules for ItineraryDays.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `itineraryDayId`: `String` (Foreign Key referring to `ItineraryDay.id`)
  * `title`: `String`
  * `description`: `String?`
  * `startTime`: `String?`
  * `endTime`: `String?`
  * `location`: `String?`
  * `cost`: `Float?` (default: `0.0`)
* **Indexes**:
  * `@@index([itineraryDayId])`
* **Relationships**:
  * `day`: `ItineraryDay` (references `itineraryDayId` -> `ItineraryDay.id`, `onDelete: Cascade`)

---

### User Recommendation (`UserRecommendation`)
Custom recommendation listings.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `location`: `String`
  * `priority`: `String` ("high", "medium", "low")
  * `reason`: `String?`
  * `type`: `String`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Travel History (`TravelHistory`)
Tracks user's past travels.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `location`: `String`
  * `time`: `DateTime`
  * `rating`: `String?`
  * `cost`: `Float` (default: `0.0`)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Favorite Food (`FavoriteFood`)
Catalog details of favorite regional food.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `name`: `String`
  * `region`: `String?`
  * `description`: `String?`
  * `rating`: `Float?`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### Saved Place (`SavedPlace`)
Bookmarks list of places.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `name`: `String`
  * `category`: `String`
  * `latitude`: `Float`
  * `longitude`: `Float`
  * `address`: `String?`
  * `imageUrl`: `String?`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)

---

### AI Feedback (`AIFeedback`)
Saves thumbs up/down ratings on chatbot replies.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `userId`: `String` (Foreign Key referring to `User.id`)
  * `messageId`: `String` (Unique, Foreign Key referring to `ChatMessage.id`)
  * `rating`: `Int` (Scale representing user satisfaction)
  * `comment`: `String?`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([userId])`
  * `@@index([messageId])`
* **Relationships**:
  * `user`: `User` (references `userId` -> `User.id`, `onDelete: Cascade`)
  * `message`: `ChatMessage` (references `messageId` -> `ChatMessage.id`, `onDelete: Cascade`)

---

### Tool Call (`ToolCall`)
Tracks LLM invocation processes.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `messageId`: `String` (Foreign Key referring to `ChatMessage.id`)
  * `toolName`: `String` (Name of tool like "Maps", "Weather")
  * `input`: `String` (Request details)
  * `output`: `String?` (Response outputs)
  * `status`: `String` ("success", "failed")
  * `createdAt`: `DateTime` (default: `now()`)
* **Indexes**:
  * `@@index([messageId])`
* **Relationships**:
  * `message`: `ChatMessage` (references `messageId` -> `ChatMessage.id`, `onDelete: Cascade`)

---

### Place Cache (`PlaceCache`)
Stores details of search places.
* **Fields**:
  * `key`: `String` (Primary Key, e.g. "query:ha-noi")
  * `value`: `String` (JSON string of details)
  * `expiresAt`: `DateTime` (TTL trigger)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)

---

### Food Cache (`FoodCache`)
Stores details of food query results.
* **Fields**:
  * `key`: `String` (Primary Key)
  * `value`: `String` (JSON string of details)
  * `expiresAt`: `DateTime` (TTL trigger)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)

---

### Blog Cache (`BlogCache`)
Stores details of blog topics.
* **Fields**:
  * `key`: `String` (Primary Key)
  * `value`: `String` (JSON string of details)
  * `expiresAt`: `DateTime` (TTL trigger)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)

---

### Knowledge Content (`KnowledgeContent`)
Text fragments used for RAG database.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `title`: `String`
  * `body`: `String` (Knowledge base source text)
  * `category`: `String` ("culture", "festival", "food", "history", "destination")
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([category])`
* **Relationships**:
  * `questions`: `KnowledgeQuestion[]` (1-to-many, mapped by `KnowledgeQuestion.contentId`)
  * `answers`: `KnowledgeAnswer[]` (1-to-many, mapped by `KnowledgeAnswer.contentId`)

---

### Knowledge Question (`KnowledgeQuestion`)
Ties sample queries to vector models.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `contentId`: `String` (Foreign Key referring to `KnowledgeContent.id`)
  * `questionText`: `String`
  * `embeddingOpenAI`: `Unsupported("vector(1536)")?` (1536-dimensional vector for OpenAI searches)
  * `embeddingLocal`: `Unsupported("vector(128)")?` (128-dimensional vector for local search queries)
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([contentId])`
* **Relationships**:
  * `content`: `KnowledgeContent` (references `contentId` -> `KnowledgeContent.id`, `onDelete: Cascade`)

---

### Knowledge Answer (`KnowledgeAnswer`)
Ties standard query replies to a KnowledgeContent record.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `contentId`: `String` (Foreign Key referring to `KnowledgeContent.id`)
  * `answerText`: `String`
  * `createdAt`: `DateTime` (default: `now()`)
  * `updatedAt`: `DateTime` (automatically updated)
* **Indexes**:
  * `@@index([contentId])`
* **Relationships**:
  * `content`: `KnowledgeContent` (references `contentId` -> `KnowledgeContent.id`, `onDelete: Cascade`)

---

### Safety Warning (`SafetyWarning`)
Disaster coordinates alerts.
* **Fields**:
  * `id`: `String` (Primary Key, UUID, default: auto-generated)
  * `type`: `String` ("FLOOD", "LANDSLIDE", "CLOSED_ROAD", "STORM")
  * `description`: `String`
  * `latitude`: `Float`
  * `longitude`: `Float`
  * `radiusKm`: `Float` (default: `1.0`)
  * `createdAt`: `DateTime` (default: `now()`)
  * `expiresAt`: `DateTime?`
* **Indexes**:
  * `@@index([latitude, longitude])` (Fast boundary mapping)
