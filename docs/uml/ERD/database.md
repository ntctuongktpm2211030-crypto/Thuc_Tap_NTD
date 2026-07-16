# SmartTravel Database Architecture Design Document

This document provides a comprehensive technical overview of the database design, entity schemas, relationships, optimization mechanisms, normalization level, performance configurations, and future improvement plans for the **SmartTravel** application.

---

## 1. Database Overview
The **SmartTravel** backend is backed by a relational **PostgreSQL** database, managed through the **Prisma ORM**. 
The schema utilizes PostgreSQL extensions (specifically `pgvector` via the `vector` extension) to support semantic search, vector storage, and Retrieval-Augmented Generation (RAG).

The schema is divided into **8 core functional modules**:
1. **Authentication & Profile**: Manages user login, authorization roles (`UserRole` enum), personal details, and user-defined preferences.
2. **User Interactions & Chat**: Handles follower loops, real-time message rooms, chatbot sessions, and user memory extraction.
3. **Destination & Event Catalog**: Stores geographic destinations (tourist attractions, hotels, restaurants), user bookmarks, and public community events.
4. **Social & Feedback**: Houses user-generated blogs, threaded comments, reactions (likes, bookmarks), and AI answer feedback loops.
5. **Media & Tracking**: Mapped stories/journeys containing routes, waypoints, and user location telemetry.
6. **Notification**: Receives real-time read/unread notifications for interactions.
7. **System Cache & Admin**: Caches external API responses (Google Places, food reviews) and manages RAG knowledge bases with vector support.
8. **Itinerary & Trips**: Hierarchical multi-day planner systems (manual trips, AI blueprint itineraries, TSP route optimization waypoint lists).

---

## 2. Entities & Schema Inventory
The database contains **46 models** mapped to tables:

### A. Authentication & Profiles
* **`User`**: Core accounts (`id` UUID, `email` Unique, `passwordHash`, role default `USER`, verification status).
* **`Profile`**: Personal metadata (`fullName`, phone, avatar url, home location).
* **`TravelPreferences`**: Curation filters (`preferredPace`, `dailyBudget`, arrays of interest categories).

### B. Chat & AI Memory
* **`Conversation`** & **`Message`**: Real-time user-to-user WebSocket chat logs.
* **`ChatConversation`**, **`ChatMessage`**, & **`ChatMessageVersion`**: Conversational interface with the AI chatbot, tracking content edits.
* **`AIMemory`**: Profile tags extracted from chatbot threads (`travelPreferences`, `favoriteFoods`, `budget`, `transportation`, `favoriteLocations`).

### C. Destination & Local Activities
* **`Destination`**:Mappable location coordinate indexes.
* **`SavedPlace`**: User bookmarks of destination items.
* **`CheckIn`**: Check-in telemetry log at destinations.
* **`Event`** & **`EventAttendee`**: RSVP-enabled local cultural gatherings or meetups.

### D. Social Blog Feed
* **`Post`**: Blog content containing media arrays and soft delete triggers.
* **`Comment`**: Hierarchical responses supporting threaded child comments.
* **`Like`** & **`Bookmark`**: Direct reaction links between posts and users.

### E. Telemetry & Media Routes
* **`Journey`**: Chronological travel logs composed of multiple routes.
* **`Route`**: Individual routes containing transport modes, colors, durations, and distances.
* **`RoutePoint`**: Detailed GPS track coordinates.
* **`Location`**: User's active/live coordinates for tracking.
* **`LocationHistory`**: Telemetry log of user coordinate streams.

### F. Trip & Itinerary Planners
* **`Trip`**, **`TripDay`**, & **`TripActivity`**: Multi-day trip schedules with activity sequences.
* **`Itinerary`**, **`ItineraryDay`**, & **`ItineraryActivity`**: Blueprints or AI templates for travel planning.

### G. Cache & RAG Systems
* **`PlaceCache`**, **`FoodCache`**, & **`BlogCache`**: TTL-based key-value caches for external endpoints.
* **`KnowledgeContent`**, **`KnowledgeQuestion`**, & **`KnowledgeAnswer`**: RAG pipeline models. `KnowledgeQuestion` utilizes `Unsupported("vector(1536)")` and `Unsupported("vector(128)")` to store high-dimensional embeddings for semantic search.
* **`SafetyWarning`**: Coordinates bounding boxes defining hazard zones (Storm, Landslide, closed roads).

---

## 3. Relationships & Foreign Key Enforcements
The design maintains structural integrity through cascading constraints and explicit association types:

```
[User] 1 ─── 0..1 [Profile] (Cascade)
[User] 1 ─── 0..1 [TravelPreferences] (Cascade)
[User] 1 ─── 0..1 [Location] (Cascade)
[User] 1 ─── 0..1 [AIMemory] (Cascade)
[User] 1 ─── 0..* [Trip] (Cascade)
[User] 1 ─── 0..* [Journey] (Cascade)
[User] 1 ─── 0..* [Post] (Cascade)

[Trip] 1 ─── 0..* [TripDay] (Cascade)
[TripDay] 1 ─── 0..* [TripActivity] (Cascade)
[Destination] 1 ─── 0..* [TripActivity] (Restrict)

[Journey] 1 ─── 0..* [Route] (Cascade)
[Route] 1 ─── 0..* [RoutePoint] (Cascade)

[ChatConversation] 1 ─── 0..* [ChatMessage] (Cascade)
[ChatMessage] 1 ─── 0..* [ChatMessageVersion] (Cascade)
[ChatMessage] 1 ─── 0..1 [AIFeedback] (Cascade)
[ChatMessage] 1 ─── 0..* [ToolCall] (Cascade)
```

### Cascading Deletes (`onDelete: Cascade`)
Weak child entities are bound to their parent models' lifecycles:
* Deleting a `User` automatically deletes `Profile`, `TravelPreferences`, `Location`, `AIMemory`, `LocationHistory`, `CheckIn`s, and `TravelHistory` logs.
* Deleting a `Trip` deletes all `TripDay` records, which cascades to delete all `TripActivity` items.
* Deleting a `Post` cascades to remove its `Comment` threads, `Like` entries, and `Bookmark` records.

### Restricting Deletes (`onDelete: SetNull` / No Cascade)
Static catalogs and cross-referenced logs are protected:
* If a `Trip` is deleted, associated blog `Post.tripId` fields are set to `null` (`onDelete: SetNull`), preserving user-generated content.
* `TripActivity` has no cascade configuration on `Destination`. Deleting a destination from the global catalog will not trigger deletions of user trip activities.

---

## 4. Indexing Strategy
To optimize throughput under read-heavy workloads, indexing is implemented on search filters and geographic coordinates:

1. **B-Tree Single Column Indexes**:
   - `User.email`: For authentication lookups.
   - `Journey.status` & `Event.startDate`/`Event.category`: To speed up dashboard search queries.
2. **Spatial Indexes**:
   - `Destination(latitude, longitude)`: Optimizes bounding box queries.
   - `RoutePoint(latitude, longitude)`: Speeds up track reconstruction.
   - `SafetyWarning(latitude, longitude)`: Enhances proximity alert triggers.
3. **Compound Indexes**:
   - `TripDay(tripId, dayIndex)` (Unique): Optimizes sequence sorting.
   - `Follower(followerId, followingId)` (Unique): Accelerates follower network lookups.

---

## 5. Constraints & Referential Integrity
Data consistency is enforced using Database-level constraints:
* **Unique Constraints**:
  - `User.email` prevents duplicate accounts.
  - `Like(postId, userId)` and `Bookmark(postId, userId)` prevent users from duplicating reactions on a post.
  - `Follower(followerId, followingId)` prevents duplicate follow connections.
  - `EventAttendee(eventId, userId)` prevents multiple RSVPs to the same event.
* **Geospatial Range Controls**:
  - Validated by the backend application logic before inserting into `latitude` (`[-90.0, 90.0]`) and `longitude` (`[-180.0, 180.0]`).
* **Foreign Key Constraints**:
  - PostgreSQL enforces referential checks, preventing invalid parent IDs for posts, comments, and routes.

---

## 6. Business Rules & Triggers
Key system behavior relies on specific database states:

* **Authentication**: Default roles are set to `USER`. Email signups generate a verification token; unverified users (`isVerified: false`) are restricted from social features until verified.
* **Geographic Proximity**: Geospatial bounds checking (using Haversine equations) restricts same-day activities in AI generation (`ai-planner.ts`) to a `15km` radius and proximity warnings to a configured `radiusKm` alert zone.
* **Thread Nesting**: Comments support self-referential nesting. Deleting a parent comment deletes all replies.
* **Collaboration Room**: Real-time Socket.io channels are mapped using `Trip.id` and `Conversation.id` as room keys.

---

## 7. Normalization Level & Trade-offs

### Normalization Level
The database design adheres to **Third Normal Form (3NF)** for its transactional modules:
- **1NF**: Every column stores atomic values (with exceptions, see denormalization below), and all tables have primary keys.
- **2NF**: No partial dependencies exist. All non-key fields depend entirely on the primary key.
- **3NF**: No transitive dependencies exist. For example, `Profile` attributes depend on `userId`, which depends on `User.id`.

### Denormalization Trade-offs
To optimize read throughput and AI pipeline integrations, intentional denormalization is applied:
1. **Flat String Arrays (`String[]`)**:
   - **Fields**: `activities`, `destinationTypes` in `TravelPreferences`, and `travelPreferences` in `AIMemory`.
   - **Trade-off**: Violates 1NF (storing non-atomic arrays). However, it avoids extra join tables and complex SQL joins during real-time LLM prompt assembly.
2. **Duplicate Geography Fields in SavedPlace**:
   - **Fields**: `SavedPlace` duplicates `name`, `latitude`, `longitude`, `address`, and `category` from the `Destination` table.
   - **Trade-off**: Saves query joins when loading user bookmarks on Leaflet maps. However, it introduces risks of outdated metadata if the destination catalog changes.
3. **Serialized JSON Notes in TripActivity**:
   - **Field**: `TripActivity.notes` stores serialized JSON strings containing extended fields like local specialties, cafes, rest durations, and transport details.
   - **Trade-off**: Avoids schema migrations for category-specific attributes, but prevents direct SQL queries on those attributes.

---

## 8. Performance Optimizations

### A. Vector Indexing for RAG
The `KnowledgeQuestion` table uses PGVector columns (`vector(1536)` and `vector(128)`). High-dimensional embeddings are queried using cosine similarity operator (`<=>`) to fetch relevant context files for LLM prompt composition.

### B. Bounding-Box Geospatial Queries
To bypass expensive mathematical Haversine calculations over the entire table, nearby destination searches use a two-step approach:
1. **Index Scan Filter**: Calculates a bounding box on the client's coordinate index and queries `Destination` with basic comparison operators (`>=` and `<=`).
2. **Precision Filter**: Runs the Haversine formula only on the filtered candidates.

### C. TTL-Based API Caching
External Google Places and food searches are cached in `PlaceCache` and `FoodCache`. Cache entries are assigned an `expiresAt` timestamp. A background cron job (`cleanExpiredCache`) runs every 6 hours to delete expired cache records, keeping the database slim.

---

## 9. Future Improvements
To improve referential integrity and simplify the database design, the following enhancements are recommended:

1. **Unify Planner Models**:
   - **Issue**: `Trip`/`TripDay`/`TripActivity` and `Itinerary`/`ItineraryDay`/`ItineraryActivity` are identical.
   - **Fix**: Merge them into `Trip` and use a boolean discriminator `isTemplate: Boolean` to differentiate user trips from reusable itinerary templates.
2. **Normalize SavedPlace**:
   - **Issue**: Replicates destination columns.
   - **Fix**: Replace flat attributes with a foreign key reference:
     ```prisma
     destinationId String
     destination   Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)
     ```
3. **Normalize Flat String Tags**:
   - **Issue**: Flat string arrays in Postgres hinder indexing.
   - **Fix**: Create dedicated `Tag` tables and link them via many-to-many relationship tables.
4. **Remove Unused Entities**:
   - **Issue**: `LocationHistory`, `TravelerMatch`, and `EventAttendee` are defined in the schema but are unused in the backend source code.
   - **Fix**: Implement the corresponding modules or prune these models from the database schema to clean up migrations.
