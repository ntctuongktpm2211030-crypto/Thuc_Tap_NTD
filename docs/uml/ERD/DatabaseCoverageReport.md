# Database Coverage & Gap Analysis Report (DatabaseCoverageReport.md)

This report presents a thorough coverage audit mapping the **28 business Use Cases** (defined in [UseCaseList.md](file:///d:/Thuc_Tap_NDT/docs/uml/usecase/UseCaseList.md)) against the database schema ([schema.prisma](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma)), backend routes, controllers, and services in `backend/src/modules/` to identify structural and functional gaps.

---

## 1. Functional Coverage Matrix

| Use Case ID | Use Case Name | Mapped Database Table(s) | Controller / Route | Service Layer | Coverage Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UC_AUTH_01** | Register Account | `User`, `Profile` | `POST /api/v1/auth/register` | `EmailService.sendVerificationEmail` | **Full** |
| **UC_AUTH_02** | Verify Email | `User` | `POST /api/v1/auth/verify-email` | Direct Router query | **Full** |
| **UC_AUTH_03** | Log In | `User`, `Profile` | `POST /api/v1/auth/login`, `/google` | Direct Router authentication | **Full** |
| **UC_AUTH_04** | Manage Profile & Prefs | `Profile`, `TravelPreferences` | `GET /api/v1/auth/me` | Direct Router query | **Full** |
| **UC_AUTH_05** | Follow Members | `Follower` | `POST /api/v1/social/follow` | Direct Router query | **Full** |
| **UC_TRIP_01** | Manage Travel Itineraries | `Trip`, `TripDay`, `TripActivity` | `POST`, `GET`, `DELETE /api/v1/trips` | Direct Router query | **Full** |
| **UC_TRIP_02** | AI Itinerary Generation | `Trip`, `TripDay`, `TripActivity` | `POST /api/v1/trips/ai-generate` | `generateAIItinerary` (`ai-planner.ts`) | **Full** |
| **UC_TRIP_03** | Route Optimization (TSP) | `TripActivity` | `POST /api/v1/trips/optimize` | `optimizeRoute` (`route-optimizer.ts`) | **Full** |
| **UC_TRIP_04** | Clone Public Itineraries | `Trip` | `POST /api/v1/trips/clone/:id` | Direct Router clone query | **Full** |
| **UC_TRIP_05** | Discover Public Trips | `Trip` | `GET /api/v1/trips/public` | Direct Router query | **Full** |
| **UC_TRIP_06** | Manage Travel History | `TravelHistory` | `api/v1/travel-history` endpoints | `TravelHistoryService` | **Full** |
| **UC_SOC_01** | Browse Community Feed | `Post`, `Comment`, `Like` | `GET /api/v1/posts` | Direct Router query | **Full** |
| **UC_SOC_02** | Manage Blog/Story Posts | `Post` | `POST`, `PUT`, `DELETE /api/v1/posts` | Direct Router query | **Full** |
| **UC_SOC_03** | Interact with Posts | `Comment`, `Like`, `Bookmark` | `api/v1/posts/:id/comment`, `/like` | Direct Router query | **Full** |
| **UC_SOC_04** | AI Companion Matching | `TravelerMatch` | None | None | 🔴 **Missing Logic** |
| **UC_MAP_01** | View Interactive Map | `Destination`, `SafetyWarning` | `GET /api/v1/map/nearby`, `/warnings` | Direct Router query | **Full** |
| **UC_MAP_02** | Perform Check-in | `CheckIn`, `Destination` | `POST /api/v1/map/checkin` | Direct Router query | **Full** |
| **UC_MAP_03** | EXIF GPS Extraction | None | None | None | 🔴 **Missing** |
| **UC_MAP_04** | Real-time Location Sync | `Location` | WebSocket Events in `server.ts` | Direct Socket broadcast | **Full** |
| **UC_MAP_05** | Manage & Join Local Events | `Event`, `EventAttendee` | `POST`, `GET /api/v1/map/events` | Direct Router query | ⚠️ **Partial** |
| **UC_MAP_06** | Manage Saved Places | `SavedPlace` | `api/v1/saved-places` endpoints | `SavedPlaceService` | **Full** |
| **UC_AI_01** | Chat with Trợ Lý Ảo | `ChatConversation`, `ChatMessage` | `POST /api/v1/chatbot/send` | `ChatbotService` | **Full** |
| **UC_AI_02** | Manage Chat History | `ChatConversation` | `GET`, `DELETE /api/v1/chatbot/conv` | `ChatbotService` | **Full** |
| **UC_AI_03** | Regenerate Chat Response | `ChatMessageVersion` | `POST /api/v1/chatbot/regenerate` | `ChatbotService` | **Full** |
| **UC_AI_04** | Submit AI Answer Rating | `AIFeedback` | `api/v1/feedback` endpoints | `FeedbackService` | **Full** |
| **UC_AI_05** | RAG Semantic Search | `KnowledgeContent`, `Question` | `POST /api/v1/rag/query` | `RagPipelineService` | **Full** |
| **UC_AI_06** | Manage Favorite Foods | `FavoriteFood` | `api/v1/favorite-foods` endpoints | `FavoriteFoodService` | **Full** |
| **UC_ADM_01** | View Analytics Dashboard | Multiple tables | `api/v1/analytics` endpoints | Direct Router query | **Full** |
| **UC_ADM_02** | Ingest RAG Knowledge | `KnowledgeContent`, `Question` | `POST /api/v1/rag/ingest` | `RagPipelineService` | **Full** |
| **UC_ADM_03** | Sanitize & Clean Raw Data | `Destination` | `GET /clean-json`, `/enrich-file` | `app.ts` custom endpoints | **Full** |
| **UC_ADM_04** | Manage System Caching | `PlaceCache`, `FoodCache` | `api/v1/cache` endpoints | `CacheService` / Cron Cleanup | **Full** |

---

## 2. Identified Coverage Gaps

Through cross-checking use cases with active code, the following significant gaps have been detected:

### Gap A: EXIF GPS Metadata Extraction (`UC_MAP_03`) — 🔴 COMPLETE GAP
* **Symptom**: The use case allows users to upload a photo and automatically decode GPS telemetry parameters from EXIF metadata.
* **Schema Gaps**: 
  - The `CheckIn` model has no fields to record media files (`photoUrl` / `mediaUrl`) or metadata parameters (camera make, capture date-time).
* **Code Gaps**: 
  - There are no endpoints, validation filters, or controller files referencing "EXIF" or performing metadata extraction in the backend project.
* **Remedy**:
  1. Add `photoUrl String?` and `exifData Json?` fields to the `CheckIn` table.
  2. Create a `/api/v1/map/exif-extract` route using libraries like `exif-parser` to capture metadata and return decimal coordinates.

### Gap B: AI Companion Matching (`UC_SOC_04`) — 🔴 FUNCTIONAL GAP (Dead Code Table)
* **Symptom**: The system is supposed to compute compatibility metrics between users to recommend travel companions.
* **Schema status**: The `TravelerMatch` table is declared in `schema.prisma`.
* **Code Gaps**:
  - The `TravelerMatch` entity is **never queried, written, or referenced** in any file under `backend/src`.
  - There is no controller, service, or route mapping companion recommendations.
* **Remedy**:
  - Create a dedicated `companion` module with a controller/service that matches user interests (using cosine similarity on `TravelPreferences` or `AIMemory` arrays) and stores recommendations inside `TravelerMatch`.

### Gap C: Joining Local Events (`UC_MAP_05`) — ⚠️ PARTIAL GAP (Unused RSVP Table)
* **Symptom**: The use case allows users to create, search, and **join/RSVP** local events.
* **Schema status**: `Event` and `EventAttendee` tables exist.
* **Code Gaps**:
  - Creating and searching events are implemented in [map.router.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts).
  - However, joining logic is **missing**. There are no endpoints or controller actions referencing the `EventAttendee` table to RSVP, track attendees, or update active counts.
* **Remedy**:
  - Expose a `POST /api/v1/map/events/:id/join` endpoint in [map.router.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts) that inserts records into `EventAttendee` and increments `Event.currentCount` within a database transaction.

---

## 3. Structural Design Gaps (Missing FKs / Duplicate Tables)

Apart from use cases, the database audit identified these critical design issues:

1. **Unlinked Locations**: `Post.locationId` is a raw string field without an FK constraint. It should reference `Destination.id`.
2. **Denormalized Bookmarks**: `SavedPlace` duplicates `Destination` fields (`latitude`, `longitude`, `address`, `category`). It should be refactored to reference `Destination` directly via an FK.
3. **Table Duplication**: The structural entities of `Trip` and `Itinerary` are identical, causing code duplication in both modules. They should be unified.
