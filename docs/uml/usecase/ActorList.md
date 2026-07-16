# Actor List - SmartTravel Platform

This document describes all actors involved in the SmartTravel application. These actors are mapped directly to roles, permissions, and internal modules of the codebase.

## 1. Human Actors

### Khách vãng lai (Guest / Anonymous Traveler)
- **Description**: An unauthenticated user who visits the platform.
- **Responsibilities**:
  - Browses public community blog posts and search feeds in [SocialFeedPage](file:///d:/Thuc_Tap_NDT/frontend/src/features/feed/SocialFeedPage.tsx).
  - Explores general travel handbooks, local guidelines, and destination articles in [BlogPage](file:///d:/Thuc_Tap_NDT/frontend/src/features/blog/BlogPage.tsx).
  - Searches and discovers public itineraries shared by other travelers via [tripsRouter](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L474-L507).
  - Views public check-ins and safety warnings on the interactive map in [MapDashboard](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx).
  - Performs account registration and logs into the platform.

### Người dùng đăng ký (Registered Traveler)
- **Description**: An authenticated user who has full access to the core personalized features of the platform.
- **Responsibilities**:
  - Inherits all privileges of a **Khách vãng lai**.
  - Manages personal profiles, bio, and specific travel preferences in [SettingsPage](file:///d:/Thuc_Tap_NDT/frontend/src/features/profile/SettingsPage.tsx).
  - Creates, modifies, clones, and deletes personal trip plans.
  - Generates AI-designed itineraries via [ai-planner.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/ai/ai-planner.ts) and regenerates specific segments/days.
  - Sắp xếp và tối ưu hóa đường đi di chuyển bằng thuật toán TSP qua [route-optimizer.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/optimizer/route-optimizer.ts).
  - Publishes blog posts and journey stories with photos, likes posts, writes nested comments, and bookmarks favorites.
  - Performs live check-ins at destinations, tracks friends' live locations, and uploads photos to extract GPS coordinates via EXIF parsing in [MapDashboard](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx).
  - Consults the Multi-Agent Chatbot in [ChatbotPage](file:///d:/Thuc_Tap_NDT/frontend/src/features/chatbot/ChatbotPage.tsx) to ask questions on local food, culture, routing, and reviews.
  - Switches between different message versions, rates AI replies, and updates long-term learning settings ([AIMemory](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma#L513-L524)).
  - Manages personal favorite foods, saved places, and travel history databases.

### Quản trị viên (Administrator)
- **Description**: A system administrator who monitors platform operations, feeds the knowledge base, and coordinates performance metrics.
- **Responsibilities**:
  - Inherits all privileges of a **Người dùng đăng nhập**.
  - Monitors real-time platform statistics, total users, check-ins, trip trends, and database latency charts in [AdminDashboard](file:///d:/Thuc_Tap_NDT/frontend/src/features/admin/AdminDashboard.tsx).
  - Uploads and ingests training documents (culture, food, festivals) into the RAG system database using [ragRouter](file:///d:/Thuc_Tap_NDT/backend/src/modules/rag/routes/rag.router.ts) or [bulk-sync.ts](file:///d:/Thuc_Tap_NDT/knowledge-builder/src/bulk-sync.ts).
  - Manages and clears platform cache databases ([cacheRouter](file:///d:/Thuc_Tap_NDT/backend/src/modules/cache/routes/cache.router.ts)).

---

## 2. External System Actors

### Dịch vụ định danh (Google Firebase Auth / Firebase Admin SDK)
- **Description**: The external authentication provider used for Google OAuth sign-in flow.
- **Responsibilities**:
  - Verifies Client-side ID Tokens and matches email/picture attributes to authenticate users on the backend via [auth.router.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.router.ts#L216-L293).

### Dịch vụ định vị địa lý (OpenStreetMap Nominatim API)
- **Description**: The geographic geocoding lookup engine used to validate the physical existence and resolve coordinates for destination strings.
- **Responsibilities**:
  - Resolves textual names (e.g. "Đất Mũi") into latitude/longitude coordinates and address attributes during geocoding check in [MapTool](file:///d:/Thuc_Tap_NDT/backend/src/modules/ai-agents/tools/agent.tools.ts).

### Dịch vụ suy luận AI (OpenAI API / Groq API)
- **Description**: External Large Language Model and Embedding provider.
- **Responsibilities**:
  - Serves text embeddings creation (using `text-embedding-3-small` in [EmbedderService](file:///d:/Thuc_Tap_NDT/ai-service/app/services/embedder.py)).
  - Processes chatbot prompts and runs reasoning calls to generate answers (using `gpt-4o-mini` or alternative model in [LlmGeneratorService](file:///d:/Thuc_Tap_NDT/ai-service/app/services/llm_generator.py)).

### Bộ máy chuẩn hóa địa danh (vietnamadminunits API)
- **Description**: Local Python web service wrapping the administrative division database of Vietnam.
- **Responsibilities**:
  - Parses raw address inputs into standardized Province, District, and Ward objects via the FastAPI endpoints `/api/v1/address/parse` and `/api/v1/address/convert` in [main.py](file:///d:/Thuc_Tap_NDT/ai-service/app/main.py#L236-L293).
