# SmartTravel Entity Specification

This document provides the complete entity specifications for the **SmartTravel** database models.

---

## 1. Authentication & Core User Domain

### User (`User`)
Represents user accounts, authentication credentials, and central database links.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID format. |
  | `email` | `String` | No | Yes | None | Yes | Yes | Valid email format, lowercase. |
  | `passwordHash` | `String` | No | Yes | None | No | No | Minimum 60-character Bcrypt hash. |
  | `role` | `UserRole` | No | Yes | `USER` | No | No | Must match `UserRole` enum (`USER`, `ADMIN`). |
  | `isVerified` | `Boolean`| No | Yes | `false` | No | No | Boolean flag. |
  | `verificationToken` | `String`| Yes | No | None | No | No | Used for email token verification. |
  | `resetPasswordToken`| `String`| Yes | No | None | No | No | Used for password reset flows. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | ISO standard date-time. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Updated on record changes. |
* **Relationships**:
  * `profile` (1-to-1 Profile)
  * `preferences` (1-to-1 TravelPreferences)
  * `trips` (1-to-many Trip)
  * `posts` (1-to-many Post)
  * `followers` / `following` (self-referencing many-to-many Follower join table)
  * `conversations` (many-to-many Conversation join table)
* **Business Rules**:
  * Email must be unique. Password hashes must be created using Bcrypt with a salt round of 12.
  * Verified status starts as `false` for normal signup and requires email activation. For Google authentication, `isVerified` is set to `true` instantly.

---

### Profile (`Profile`)
Stores user personal metadata and display settings.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID format. |
  | `userId` | `String` | No | Yes | None | Yes (FK) | Yes | References `User.id`. |
  | `fullName` | `String` | No | Yes | None | No | No | Must be non-empty string. |
  | `avatarUrl` | `String` | Yes | No | None | No | No | Must be a valid URL string. |
  | `coverUrl` | `String` | Yes | No | None | No | No | Must be a valid URL string. |
  | `bio` | `String` | Yes | No | None | No | No | Max length 500 characters. |
  | `phoneNumber`| `String` | Yes | No | None | No | No | Matches regional phone formats. |
  | `homeLocation`| `String`| Yes | No | None | No | No | Free-form address string. |
* **Relationships**:
  * `user`: `User` (1-to-1 link on `userId` referencing `User.id` with `onDelete: Cascade`).
* **Business Rules**:
  * One profile must exist for each user. Profiles are deleted automatically if the parent user account is deleted.

---

### Travel Preferences (`TravelPreferences`)
Defines the user's travel pace, budget, and tag selections for recommendation scoring.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | Yes (FK) | Yes | References `User.id`. |
  | `preferredPace`| `String` | No | Yes | None | No | No | Must be `"slow"`, `"moderate"`, or `"fast"`. |
  | `dailyBudget` | `Float` | No | Yes | None | No | No | Must be a positive number. |
  | `activities` | `String[]`| No | Yes | None | No | No | Interest categories array (e.g. culture, food). |
  | `destinationTypes`| `String[]`| No | Yes | None | No | No | Mapped tags like mountain, beach, city. |
  | `foodPreferences`| `String[]`| No | Yes | None | No | No | Food category strings. |
* **Relationships**:
  * `user`: `User` (1-to-1 link on `userId` referencing `User.id` with `onDelete: Cascade`).
* **Business Rules**:
  * `dailyBudget` must be a positive number (> 0).
  * Travel preferences are loaded at runtime to score and prioritize destinations dynamically.

---

## 2. Manual & AI Trips Planner

### Trip (`Trip`)
Represents the top-level container of a planned trip itinerary.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `ownerId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `title` | `String` | No | Yes | None | No | No | Trip title string. |
  | `description`| `String` | Yes | No | None | No | No | Free-form details. |
  | `destinationName`| `String`| No | Yes | None | No | No | Target province name. |
  | `startDate` | `DateTime`| No | Yes | None | No | No | ISO Date format. |
  | `endDate` | `DateTime`| No | Yes | None | No | No | ISO Date format. |
  | `totalBudget`| `Float` | No | Yes | None | No | No | Positive float value. |
  | `travelStyle`| `String` | No | Yes | None | No | No | `"solo"`, `"family"`, `"friends"`, `"couple"`. |
  | `isPublic` | `Boolean`| No | Yes | `false` | No | No | Visibility flag. |
  | `cloneSourceId`| `String`| Yes | No | None | No (FK) | Yes | Self-reference to cloned `Trip.id`. |
* **Relationships**:
  * `owner`: `User` (referenced by `ownerId` -> `User.id`, `onDelete: Cascade`).
  * `cloneSource`: `Trip?` (referenced by `cloneSourceId` -> `Trip.id`, `onDelete: SetNull`).
  * `days`: `TripDay[]` (1-to-many)
* **Business Rules**:
  * `endDate` must be greater than or equal to `startDate`.
  * If a trip is cloned, the `cloneSourceId` maps back to the original trip, and clone counters can be tracked.

---

### Trip Day (`TripDay`)
Calculates coordinates and lists activities for individual dates of a Trip.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `tripId` | `String` | No | Yes | None | No (FK) | Yes | References `Trip.id`. |
  | `dayIndex` | `Int` | No | Yes | None | No | No | 1-based index (e.g. 1, 2, 3). |
  | `date` | `DateTime`| No | Yes | None | No | No | Date matches trip day offset. |
* **Constraints**:
  * `@@unique([tripId, dayIndex])` (Prevents duplicate days inside the same trip).
* **Relationships**:
  * `trip`: `Trip` (referenced by `tripId` -> `Trip.id`, `onDelete: Cascade`).
  * `activities`: `TripActivity[]` (1-to-many).

---

### Trip Activity (`TripActivity`)
Timeline items mapped on a TripDay.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `tripDayId` | `String` | No | Yes | None | No (FK) | Yes | References `TripDay.id`. |
  | `destinationId`| `String`| No | Yes | None | No (FK) | Yes | References `Destination.id`. |
  | `startTime` | `String` | No | Yes | None | No | No | String matching `"HH:MM"` (24h format). |
  | `endTime` | `String` | No | Yes | None | No | No | String matching `"HH:MM"` (24h format). |
  | `estimatedCost`| `Float`| No | Yes | `0.0` | No | No | Must be positive float. |
  | `sequenceOrder`| `Int`  | No | Yes | None | No | No | Integer sequencing order. |
  | `notes` | `String` | Yes | No | None | No | No | String or serialized JSON configurations. |
* **Relationships**:
  * `tripDay`: `TripDay` (referenced by `tripDayId` -> `TripDay.id`, `onDelete: Cascade`).
  * `destination`: `Destination` (referenced by `destinationId` -> `Destination.id`).
* **Business Rules**:
  * `endTime` must be chronologically after `startTime`.
  * `sequenceOrder` must be sequential for correct map routes drawing.

---

### Destination (`Destination`)
Spatial coordinates and details of spots.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `name` | `String` | No | Yes | None | No | No | String title of place. |
  | `description`| `String` | Yes | No | None | No | No | Free-form text descriptions. |
  | `latitude` | `Float` | No | Yes | None | No | Yes | Range: `-90.0` to `90.0`. |
  | `longitude` | `Float` | No | Yes | None | No | Yes | Range: `-180.0` to `180.0`. |
  | `category` | `String` | No | Yes | None | No | No | `"restaurant"`, `"hotel"`, `"attraction"`, etc. |
  | `averageRating`| `Float`| No | Yes | `0.0` | No | No | Range: `0.0` to `5.0`. |
  | `address` | `String` | Yes | No | None | No | No | Complete text address. |
  | `openingHours`| `String` | Yes | No | None | No | No | Hours description text. |
* **Indexes**:
  * `@@index([latitude, longitude])` (Fast bounding box search).

---

## 3. Social & Messaging Domain

### Post (`Post`)
Social media blog feed.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `authorId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `content` | `String` | No | Yes | None | No | No | Main post text. |
  | `mediaUrls` | `String[]`| No | Yes | None | No | No | Array of valid media URLs. |
  | `tripId` | `String` | Yes | No | None | No (FK) | Yes | Optional references to `Trip.id`. |
  | `locationId` | `String` | Yes | No | None | No | No | Optional loose string address. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
  | `deletedAt` | `DateTime`| Yes | No | None | No | No | Soft-delete timestamp. |
* **Relationships**:
  * `author`: `User` (referenced by `authorId` -> `User.id`, `onDelete: Cascade`).
  * `trip`: `Trip?` (referenced by `tripId` -> `Trip.id`, `onDelete: SetNull`).
  * `comments` / `likes` / `bookmarks` (Child references).

---

### Comment (`Comment`)
Post responses support threads.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `postId` | `String` | No | Yes | None | No (FK) | Yes | References `Post.id`. |
  | `authorId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `content` | `String` | No | Yes | None | No | No | Non-empty string content. |
  | `parentId` | `String` | Yes | No | None | No (FK) | Yes | Self-reference to parent `Comment.id`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
* **Relationships**:
  * `post`: `Post` (`postId` -> `Post.id`, `onDelete: Cascade`).
  * `author`: `User` (`authorId` -> `User.id`, `onDelete: Cascade`).
  * `parent`: `Comment?` (`parentId` -> `Comment.id`, `onDelete: Cascade`).

---

### Like (`Like`)
Blog posts like relation.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `postId` | `String` | No | Yes | None | No (FK) | Yes | References `Post.id`. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
* **Constraints**:
  * `@@unique([postId, userId])` (Enforces one like per user per post).

---

### Bookmark (`Bookmark`)
Blog posts saved list relation.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `postId` | `String` | No | Yes | None | No (FK) | Yes | References `Post.id`. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
* **Constraints**:
  * `@@unique([postId, userId])` (Enforces one bookmark per user per post).

---

### Follower (`Follower`)
Social follower networks.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `followerId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `followingId`| `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
* **Constraints**:
  * `@@unique([followerId, followingId])` (Prevents duplicate following status).

---

### Message (`Message`)
Peer-to-peer chat text history.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `conversationId`| `String`| No | Yes | None | No (FK) | Yes | References `Conversation.id`. |
  | `senderId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `content` | `String` | No | Yes | None | No | No | Message body text. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
* **Relationships**:
  * `conversation`: `Conversation` (`conversationId` -> `Conversation.id`, `onDelete: Cascade`).
  * `sender`: `User` (`senderId` -> `User.id`, `onDelete: Cascade`).

---

### Conversation (`Conversation`)
Chat rooms linking participants.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Updated on change. |
* **Relationships**:
  * `participants`: `User[]` (Implicit many-to-many using join table `_ConversationParticipants`).

---

### Notification (`Notification`)
Alerts triggered on social activity.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `recipientId`| `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `type` | `String` | No | Yes | None | No | No | `"like"`, `"comment"`, `"friend_request"`, `"invitation"`. |
  | `content` | `String` | No | Yes | None | No | No | System generated message. |
  | `isRead` | `Boolean`| No | Yes | `false` | No | No | Status indicator. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
* **Relationships**:
  * `recipient`: `User` (`recipientId` -> `User.id`, `onDelete: Cascade`).

---

## 4. Location Tracking & Mappings

### Location (`Location`)
User current coordinates.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | Yes (FK) | Yes | References `User.id`. |
  | `latitude` | `Float` | No | Yes | None | No | No | Coordinate range `-90.0` to `90.0`. |
  | `longitude` | `Float` | No | Yes | None | No | No | Coordinate range `-180.0` to `180.0`. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Updated on GPS changes. |
* **Relationships**:
  * `user`: `User` (1-to-1 link `userId` -> `User.id`, relation name `"UserLiveLocation"`, `onDelete: Cascade`).

---

### Location History (`LocationHistory`)
Historical track coordinates records.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `latitude` | `Float` | No | Yes | None | No | Yes | Lat coordinate bounds. |
  | `longitude` | `Float` | No | Yes | None | No | Yes | Lng coordinate bounds. |
  | `accuracy` | `Float` | Yes | No | None | No | No | Meters scale accuracy. |
  | `speed` | `Float` | Yes | No | None | No | No | Speed value (meters/second). |
  | `heading` | `Float` | Yes | No | None | No | No | Orientation degree value (`0` to `360`). |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | Yes | Creation timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).

---

### Journey (`Journey`)
Travel story diaries.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `title` | `String` | No | Yes | None | No | No | Non-empty string. |
  | `description`| `String` | Yes | No | None | No | No | Markdown detail description. |
  | `coverImageUrl`| `String`| Yes | No | None | No | No | Valid image URL format. |
  | `isPublic` | `Boolean`| No | Yes | `true` | No | No | Boolean status. |
  | `status` | `String` | No | Yes | `draft` | No | Yes | `"draft"`, `"active"`, `"completed"`. |
  | `startDate` | `DateTime`| Yes | No | None | No | No | Date-time value. |
  | `endDate` | `DateTime`| Yes | No | None | No | No | Date-time value. |
  | `totalDistance`| `Float`| No | Yes | `0.0` | No | No | Positive float value (in km). |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Standard timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Updated on change. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).
  * `routes`: `Route[]` (1-to-many).

---

### Route (`Route`)
Visual route paths drawn on maps inside a Journey.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `journeyId` | `String` | No | Yes | None | No (FK) | Yes | References `Journey.id`. |
  | `name` | `String` | No | Yes | None | No | No | Path title. |
  | `description`| `String` | Yes | No | None | No | No | Free-form detail string. |
  | `transportMode`| `String`| No | Yes | `walking` | No | No | `"walking"`, `"driving"`, `"cycling"`, `"transit"`. |
  | `distanceKm` | `Float` | No | Yes | `0.0` | No | No | Must be positive float. |
  | `durationMin`| `Int`   | No | Yes | `0` | No | No | Must be positive integer. |
  | `color` | `String` | No | Yes | `#D4A843`| No | No | Hex color code string (e.g. `^#([A-Fa-f0-9]{6})$`). |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
* **Relationships**:
  * `journey`: `Journey` (`journeyId` -> `Journey.id`, `onDelete: Cascade`).
  * `points`: `RoutePoint[]` (1-to-many).

---

### Route Point (`RoutePoint`)
GPS waypoints constructing a Route.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `routeId` | `String` | No | Yes | None | No (FK) | Yes | References `Route.id`. |
  | `latitude` | `Float` | No | Yes | None | No | Yes | Lat coordinate bounds. |
  | `longitude` | `Float` | No | Yes | None | No | Yes | Lng coordinate bounds. |
  | `altitude` | `Float` | Yes | No | None | No | No | Meters scale elevation float. |
  | `sequenceOrder`| `Int`  | No | Yes | None | No | No | Incremental sorting index. |
  | `timestamp` | `DateTime`| No | Yes | `now()` | No | No | Chronological timestamp. |
  | `note` | `String` | Yes | No | None | No | No | Optional waypoint text comment. |
  | `photoUrl` | `String` | Yes | No | None | No | No | Optional waypoint image URL. |
* **Relationships**:
  * `route`: `Route` (`routeId` -> `Route.id`, `onDelete: Cascade`).

---

### CheckIn (`CheckIn`)
User check-in logs at specific coordinates.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `destinationId`| `String`| No | Yes | None | No (FK) | Yes | References `Destination.id`. |
  | `note` | `String` | Yes | No | None | No | No | Text description of check-in. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Check-in timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).
  * `destination`: `Destination` (`destinationId` -> `Destination.id`, `onDelete: Cascade`).

---

## 5. Event Management

### Event (`Event`)
Public local festival and meetup schedules.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `title` | `String` | No | Yes | None | No | No | String title. |
  | `description`| `String` | Yes | No | None | No | No | Text body context. |
  | `coverImageUrl`| `String`| Yes | No | None | No | No | URL of cover photo. |
  | `destinationId`| `String`| Yes | No | None | No (FK) | No | Optional references to `Destination.id`. |
  | `latitude` | `Float` | No | Yes | None | No | Yes | GPS latitude. |
  | `longitude` | `Float` | No | Yes | None | No | Yes | GPS longitude. |
  | `startDate` | `DateTime`| No | Yes | None | No | Yes | Event start timestamp. |
  | `endDate` | `DateTime`| Yes | No | None | No | No | Event end timestamp. |
  | `category` | `String` | No | Yes | None | No | Yes | `"festival"`, `"meetup"`, `"tour"`, `"workshop"`, `"cultural"`. |
  | `maxAttendees`| `Int`   | Yes | No | None | No | No | Positive integer capacity. |
  | `currentCount`| `Int`   | No | Yes | `0` | No | No | Mapped to active RSVP total. |
  | `organizerId`| `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `isPublic` | `Boolean`| No | Yes | `true` | No | No | Boolean flag. |
* **Relationships**:
  * `destination`: `Destination?` (`destinationId` -> `Destination.id`, `onDelete: SetNull`).
  * `organizer`: `User` (`organizerId` -> `User.id`, relation name `"EventOrganizer"`, `onDelete: Cascade`).
  * `attendees`: `EventAttendee[]` (1-to-many).

---

### Event Attendee (`EventAttendee`)
User attendance tracking for Events.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `eventId` | `String` | No | Yes | None | No (FK) | Yes | References `Event.id`. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `status` | `String` | No | Yes | `going` | No | No | `"going"`, `"interested"`, `"maybe"`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
* **Constraints**:
  * `@@unique([eventId, userId])` (Enforces single ticket registration per user per event).
* **Relationships**:
  * `event`: `Event` (`eventId` -> `Event.id`, `onDelete: Cascade`).
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).

---

## 6. AI Chatbot & Memory

### Chat Conversation (`ChatConversation`)
AI threads.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `title` | `String` | Yes | No | `"New Conversation"`| No | No | String label. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Updated on message additions. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).
  * `messages`: `ChatMessage[]` (1-to-many).

---

### Chat Message (`ChatMessage`)
Thread entries within ChatConversations.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `conversationId`| `String`| No | Yes | None | No (FK) | Yes | References `ChatConversation.id`. |
  | `role` | `String` | No | Yes | None | No | No | Must be `"user"`, `"assistant"`, or `"system"`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `conversation`: `ChatConversation` (`conversationId` -> `ChatConversation.id`, `onDelete: Cascade`).
  * `versions`: `ChatMessageVersion[]` (1-to-many).
  * `feedback`: `AIFeedback?` (1-to-1 relation).
  * `toolCalls`: `ToolCall[]` (1-to-many).

---

### Chat Message Version (`ChatMessageVersion`)
Keeps track of message edits for active sessions.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `messageId` | `String` | No | Yes | None | No (FK) | Yes | References `ChatMessage.id`. |
  | `content` | `String` | No | Yes | None | No | No | Message markdown string. |
  | `version` | `Int` | No | Yes | None | No | No | 1-based version number integer. |
  | `isActive` | `Boolean`| No | Yes | `true` | No | No | Boolean flag. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
* **Relationships**:
  * `message`: `ChatMessage` (`messageId` -> `ChatMessage.id`, `onDelete: Cascade`).

---

### AI Memory (`AIMemory`)
Extracted profile metadata summarizing traveler preferences.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | Yes (FK) | Yes | References `User.id`. |
  | `travelPreferences`| `String[]`| No | Yes | None | No | No | Interests extracted from chats. |
  | `favoriteFoods` | `String[]`| No | Yes | None | No | No | Dishes user likes. |
  | `budget` | `String` | Yes | No | None | No | No | `"thấp"`, `"trung bình"`, `"cao"`. |
  | `transportation`| `String[]`| No | Yes | None | No | No | Preferred vehicles. |
  | `favoriteLocations`| `String[]`| No | Yes | None | No | No | Destination spots. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Updated when chatbot extracts profile updates. |
* **Relationships**:
  * `user`: `User` (1-to-1 link `userId` -> `User.id`, `onDelete: Cascade`).

---

### AI Feedback (`AIFeedback`)
Saves user ratings on chatbot responses.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `messageId` | `String` | No | Yes | None | Yes (FK) | Yes | References `ChatMessage.id`. |
  | `rating` | `Int` | No | Yes | None | No | No | Value range (e.g. `1` to `5` or `-1`/`1`). |
  | `comment` | `String` | Yes | No | None | No | No | Optional review text. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).
  * `message`: `ChatMessage` (`messageId` -> `ChatMessage.id`, `onDelete: Cascade`).

---

### Tool Call (`ToolCall`)
Tracks LLM invocation processes.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `messageId` | `String` | No | Yes | None | No (FK) | Yes | References `ChatMessage.id`. |
  | `toolName` | `String` | No | Yes | None | No | No | String identifier of tool. |
  | `input` | `String` | No | Yes | None | No | No | Request JSON input arguments string. |
  | `output` | `String` | Yes | No | None | No | No | Response JSON outputs string. |
  | `status` | `String` | No | Yes | None | No | No | `"success"`, `"failed"`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
* **Relationships**:
  * `message`: `ChatMessage` (`messageId` -> `ChatMessage.id`, `onDelete: Cascade`).

---

## 7. Recommendations

### Recommendation (`Recommendation`)
Scored catalog suggestions mapped to a Trip.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `tripId` | `String` | No | Yes | None | No (FK) | Yes | References `Trip.id`. |
  | `destinationId`| `String`| No | Yes | None | No (FK) | No | References `Destination.id`. |
  | `score` | `Float` | No | Yes | None | No | No | Range: `0.0` to `1.0`. |
  | `recommendationReason`| `String`| Yes| No| None | No| No| Reason notes. |
* **Relationships**:
  * `trip`: `Trip` (`tripId` -> `Trip.id`, `onDelete: Cascade`).
  * `destination`: `Destination` (`destinationId` -> `Destination.id`, `onDelete: Cascade`).

---

### User Recommendation (`UserRecommendation`)
Custom recommendation listings.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `location` | `String` | No | Yes | None | No | No | Text string location. |
  | `priority` | `String` | No | Yes | None | No | No | `"high"`, `"medium"`, `"low"`. |
  | `reason` | `String` | Yes | No | None | No | No | Description reasons. |
  | `type` | `String` | No | Yes | None | No | No | Recommendation category tag. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).

---

## 8. Traveler Compatibility

### Traveler Match (`TravelerMatch`)
Social compatibility calculations.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `matchedUserId`| `String`| No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `compatScore` | `Float` | No | Yes | None | No | Yes | Compatibility score range: `0.0` to `1.0`. |
  | `matchReasons` | `String[]`| No | Yes | None | No | No | Overlapping tag reasons array. |
  | `status` | `String` | No | Yes | `suggested`| No | No | `"suggested"`, `"accepted"`, `"declined"`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Constraints**:
  * `@@unique([userId, matchedUserId])`
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, relation name `"TravelerMatchUser"`, `onDelete: Cascade`).
  * `matchedUser`: `User` (`matchedUserId` -> `User.id`, relation name `"TravelerMatchTarget"`, `onDelete: Cascade`).

---

## 9. Structured Itinerary Blueprints

### Itinerary (`Itinerary`)
Structured schedule templates.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `title` | `String` | No | Yes | None | No | No | Non-empty template title. |
  | `description`| `String` | Yes | No | None | No | No | Context detail markdown. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).
  * `days`: `ItineraryDay[]` (1-to-many).

---

### Itinerary Day (`ItineraryDay`)
Contains activities mapped on a calendar date.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `itineraryId` | `String` | No | Yes | None | No (FK) | Yes | References `Itinerary.id`. |
  | `dayIndex` | `Int` | No | Yes | None | No | No | 1-based day sequencing order. |
  | `date` | `DateTime`| Yes | No | None | No | No | Optional calendar day offset date. |
* **Relationships**:
  * `itinerary`: `Itinerary` (`itineraryId` -> `Itinerary.id`, `onDelete: Cascade`).
  * `activities`: `ItineraryActivity[]` (1-to-many).

---

### Itinerary Activity (`ItineraryActivity`)
Activity schedules for ItineraryDays.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `itineraryDayId`| `String`| No | Yes | None | No (FK) | Yes | References `ItineraryDay.id`. |
  | `title` | `String` | No | Yes | None | No | No | Activity description label. |
  | `description`| `String` | Yes | No | None | No | No | Detail info text. |
  | `startTime` | `String` | Yes | No | None | No | No | Optional timing string `"HH:MM"`. |
  | `endTime` | `String` | Yes | No | None | No | No | Optional timing string `"HH:MM"`. |
  | `location` | `String` | Yes | No | None | No | No | Optional destination free-form string. |
  | `cost` | `Float` | Yes | No | `0.0` | No | No | Must be positive float value. |
* **Relationships**:
  * `day`: `ItineraryDay` (`itineraryDayId` -> `ItineraryDay.id`, `onDelete: Cascade`).

---

## 10. User Custom Records

### Travel History (`TravelHistory`)
Tracks user's past travels.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `location` | `String` | No | Yes | None | No | No | Non-empty string. |
  | `time` | `DateTime`| No | Yes | None | No | No | valid Date string parsing. |
  | `rating` | `String` | Yes | No | None | No | No | Rating description comments. |
  | `cost` | `Float` | No | Yes | `0.0` | No | No | Must be positive float value. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).

---

### Favorite Food (`FavoriteFood`)
Catalog details of favorite regional food.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `name` | `String` | No | Yes | None | No | No | Food item name. |
  | `region` | `String` | Yes | No | None | No | No | Regional origins text. |
  | `description`| `String` | Yes | No | None | No | No | Dish description. |
  | `rating` | `Float` | Yes | No | None | No | No | Rating limits `0.0` to `5.0`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).

---

### Saved Place (`SavedPlace`)
Bookmarks list of places.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `userId` | `String` | No | Yes | None | No (FK) | Yes | References `User.id`. |
  | `name` | `String` | No | Yes | None | No | No | Place name. |
  | `category` | `String` | No | Yes | None | No | No | `"restaurant"`, `"hotel"`, `"attraction"`. |
  | `latitude` | `Float` | No | Yes | None | No | No | Lat coordinates. |
  | `longitude` | `Float` | No | Yes | None | No | No | Lng coordinates. |
  | `address` | `String` | Yes | No | None | No | No | Text address. |
  | `imageUrl` | `String` | Yes | No | None | No | No | Image URL string. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `user`: `User` (`userId` -> `User.id`, `onDelete: Cascade`).

---

## 11. System Caches

### Place Cache (`PlaceCache`)
Stores details of search places.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `key` | `String` | No | Yes | None | Yes (PK) | Yes | Mapped query or key identifier string. |
  | `value` | `String` | No | Yes | None | No | No | Serialized place JSON data. |
  | `expiresAt` | `DateTime`| No | Yes | None | No | No | Expiration timestamp. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |

---

### Food Cache (`FoodCache`)
Stores details of food query results.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `key` | `String` | No | Yes | None | Yes (PK) | Yes | Mapped query string. |
  | `value` | `String` | No | Yes | None | No | No | Serialized food JSON data. |
  | `expiresAt` | `DateTime`| No | Yes | None | No | No | Expiration timestamp. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |

---

### Blog Cache (`BlogCache`)
Stores details of blog topics.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `key` | `String` | No | Yes | None | Yes (PK) | Yes | Topic query string. |
  | `value` | `String` | No | Yes | None | No | No | Serialized blog list JSON. |
  | `expiresAt` | `DateTime`| No | Yes | None | No | No | Expiration timestamp. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |

---

## 12. RAG Knowledge Base

### Knowledge Content (`KnowledgeContent`)
Text fragments used for RAG database.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `title` | `String` | No | Yes | None | No | No | Content title. |
  | `body` | `String` | No | Yes | None | No | No | Core knowledge context text string. |
  | `category` | `String` | No | Yes | None | No | Yes | `"culture"`, `"festival"`, `"food"`, `"history"`, `"destination"`. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `questions`: `KnowledgeQuestion[]` (1-to-many).
  * `answers`: `KnowledgeAnswer[]` (1-to-many).

---

### Knowledge Question (`KnowledgeQuestion`)
Ties sample queries to vector models.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `contentId` | `String` | No | Yes | None | No (FK) | Yes | References `KnowledgeContent.id`. |
  | `questionText`| `String`| No | Yes | None | No | No | Mapped question text. |
  | `embeddingOpenAI`| `vector(1536)`| Yes| No| None | No | No | 1536-dimensional vector array. |
  | `embeddingLocal` | `vector(128)` | Yes| No| None | No | No | 128-dimensional vector array. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `content`: `KnowledgeContent` (`contentId` -> `KnowledgeContent.id`, `onDelete: Cascade`).

---

### Knowledge Answer (`KnowledgeAnswer`)
Ties standard query replies to a KnowledgeContent record.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `contentId` | `String` | No | Yes | None | No (FK) | Yes | References `KnowledgeContent.id`. |
  | `answerText`| `String` | No | Yes | None | No | No | Standardized answer template. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `updatedAt` | `DateTime`| No | Yes | Auto | No | No | Update timestamp. |
* **Relationships**:
  * `content`: `KnowledgeContent` (`contentId` -> `KnowledgeContent.id`, `onDelete: Cascade`).

---

## 13. Safety Warnings

### Safety Warning (`SafetyWarning`)
Disaster coordinates alerts.
* **Fields**:
  | Field | Type | Nullable | Required | Default | Unique | Index | Validation / Constraints |
  | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
  | `id` | `String` | No | Yes | `uuid()` | Yes (PK) | Yes | Valid UUID. |
  | `type` | `String` | No | Yes | None | No | No | `"FLOOD"`, `"LANDSLIDE"`, `"CLOSED_ROAD"`, `"STORM"`. |
  | `description`| `String` | No | Yes | None | No | No | Warning description text. |
  | `latitude` | `Float` | No | Yes | None | No | Yes | Target GPS latitude. |
  | `longitude` | `Float` | No | Yes | None | No | Yes | Target GPS longitude. |
  | `radiusKm` | `Float` | No | Yes | `1.0` | No | No | Blast warning radius in kilometers. |
  | `createdAt` | `DateTime`| No | Yes | `now()` | No | No | Creation timestamp. |
  | `expiresAt` | `DateTime`| Yes | No | None | No | No | Expiration timestamp. |
* **Indexes**:
  * `@@index([latitude, longitude])` (Fast warning area bounding queries).
* **Business Rules**:
  * A warning is considered active if `expiresAt` is null or in the future compared to the system date-time.
