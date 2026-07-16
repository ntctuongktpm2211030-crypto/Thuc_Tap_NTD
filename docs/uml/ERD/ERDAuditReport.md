# SmartTravel Database Audit & ERD Audit Report

This report documents the architectural audit of the database entities, relationships, constraints, and schemas reverse-engineered from [schema.prisma](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma) and its usage across the backend codebase.

---

## 1. Missing Primary Keys (PK)
* **Status**: **PASS**
* **Finding**: No database tables are missing a primary key. Every entity defines a distinct primary key using `@id` (either an auto-generated UUID or a unique string key like `PlaceCache.key`).

---

## 2. Missing Foreign Keys (FK) & Missing Relationships
Several loose string fields represent references but lack defined database constraints or navigation properties in Prisma:

### A. Post Location Link
* **Field**: `Post.locationId` (`String?`)
* **Issue**: Stored as a loose string field. It has no foreign key constraint mapping it to the `Destination` catalog.
* **Impact**: Prone to referential disconnects; querying posts near or associated with a specific tourist destination is inefficient and lacks referential integrity.
* **Recommendation**: Refactor to:
  ```prisma
  locationId   String?
  destination  Destination? @relation(fields: [locationId], references: [id], onDelete: SetNull)
  ```

### B. Flat Location References in Domain Entities
Three entities use flat text `location` strings instead of linking to the `Destination` catalog:
1. **`SavedPlace`**: Stores `latitude`, `longitude`, `address`, and `category` as flat duplicate fields.
2. **`TravelHistory`**: Stores `location` as a flat `String`.
3. **`UserRecommendation`**: Stores `location` as a flat `String`.
* **Issue**: Storing coordinates and addresses as flat strings bypasses the centralized destination catalog. It introduces typing mismatch anomalies (e.g. misspelling `"Hanoi"` vs `"Ha Noi"`).
* **Recommendation**: Replace string fields with FKs:
  ```prisma
  destinationId String
  destination   Destination @relation(fields: [destinationId], references: [id])
  ```

---

## 3. Duplicate Fields & Redundancy

### A. SavedPlace vs. Destination
* **Issue**: `SavedPlace` acts as a bookmark list but replicates `Destination` attributes:
  ```prisma
  model SavedPlace {
    name      String
    category  String
    latitude  Float
    longitude Float
    address   String?
  }
  ```
* **Impact**: If a tourist destination address or category is corrected, bookmarks remain outdated.
* **Recommendation**: Refactor `SavedPlace` to refer to `Destination` via a foreign key relation.

### B. TravelPreferences vs. AIMemory
* **Issue**: Overlapping preference records:
  - `TravelPreferences` holds `preferredPace`, `dailyBudget`, `activities`, `destinationTypes`, `foodPreferences`.
  - `AIMemory` holds `travelPreferences`, `favoriteFoods`, `budget`, `transportation`, `favoriteLocations`.
* **Impact**: Two different structures store user interests, making profile synchronization difficult (e.g., changes made by the user in preferences might not reflect in the AI memory prompt templates).
* **Recommendation**: Unify the models or establish a clear synchronization service that updates `TravelPreferences` when the AI updates `AIMemory`.

---

## 4. Duplicate Entities & Table Overlap

### `Itinerary` vs `Trip`
* **Issue**: The schema maintains two identical three-level hierarchies:
  - `Trip` -> `TripDay` -> `TripActivity`
  - `Itinerary` -> `ItineraryDay` -> `ItineraryActivity`
* **Analysis**:
  - `Trip` activities link directly to the `Destination` entity.
  - `Itinerary` activities use flat string fields (`title`, `description`, `location`).
* **Impact**: Causes high redundancy in CRUD endpoints, validation middlewares, schemas, and queries.
* **Recommendation**: Merge both structures. Add a boolean flag like `isTemplate` or `isDraft` to the `Trip` table to handle generic templates or AI blueprints without duplicating the data tables.

---

## 5. Wrong Cardinality & Model Types

### A. Flat String Arrays in PostgreSQL
* **Field types**: `activities String[]`, `destinationTypes String[]`, `travelPreferences String[]`, `favoriteFoods String[]` inside `TravelPreferences` and `AIMemory`.
* **Issue**: Postgres stores string arrays as flat, comma-separated lists, which makes sub-indexing and tag search queries inefficient.
* **Recommendation**: Model these tags as separate `Tag` tables with many-to-many relations for index optimization.

### B. Location 1-to-1 User Link
* **Model**: `Location` (`userId` as `@unique`)
* **Issue**: Relational cardinality is correct (1 active live location per user), but duplicate fields exist between the `Location` table and the `LocationHistory` table (which logs historical coordinate streams).
* **Recommendation**: Maintain `LocationHistory` for telemetry logging and update a single nullable field or link to represent the active point to reduce table bloat.

---

## 6. Weak Entities & Referential Integrity
* **Status**: **PASS**
* **Finding**: Weak entities (dependent on parent records) are correctly configured with `onDelete: Cascade` rules.
* **Key Cascade Mappings**:
  - `Profile` & `TravelPreferences` cascade delete on `User`.
  - `TripDay` cascades on `Trip`; `TripActivity` cascades on `TripDay`.
  - `Route` cascades on `Journey`; `RoutePoint` cascades on `Route`.
  - `ChatMessage` cascades on `ChatConversation`; `ChatMessageVersion`, `AIFeedback`, and `ToolCall` cascade on `ChatMessage`.

---

## 7. Junction Tables
The database makes a healthy distinction between implicit and explicit junction tables:

* **Implicit Junctions**:
  - `_ConversationParticipants` (Many-to-many mapping for chat rooms).
* **Explicit Junctions (with metadata/rules)**:
  - `Follower` (followerId, followingId) - has `@@unique([followerId, followingId])`.
  - `Like` (postId, userId) - has `@@unique([postId, userId])`.
  - `Bookmark` (postId, userId) - has `@@unique([postId, userId])`.
  - `EventAttendee` (eventId, userId, status) - has `@@unique([eventId, userId])`.
  - `TravelerMatch` (userId, matchedUserId, compatScore, matchReasons) - has `@@unique([userId, matchedUserId])`.

---

## 8. Unused Entities & Collections
A scan of the backend codebase reveals several models defined in the database schema that are **never queried, inserted, or updated** in the backend controllers or services:

1. **`LocationHistory`**
   - **Audit**: Defined in `schema.prisma` but not found in any backend file.
   - **Impact**: Dead code table.
2. **`TravelerMatch`**
   - **Audit**: Defined in `schema.prisma` but has zero references in backend controller/service/router scripts.
   - **Impact**: AI matching logic is either not implemented or disabled.
3. **`EventAttendee`**
   - **Audit**: Defined in `schema.prisma` but has zero references in backend scripts.
   - **Impact**: Users cannot RSVP or attend events in the current backend version.
