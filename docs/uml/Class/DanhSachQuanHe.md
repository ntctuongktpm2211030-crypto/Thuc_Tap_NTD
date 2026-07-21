# Danh sách Mối quan hệ giữa các Lớp trong Hệ thống (UML Relationships)

Tài liệu này tổng hợp toàn bộ các mối quan hệ cấu trúc (Inheritance, Realization, Association, Composition, Aggregation, Dependency) giữa các lớp trong hệ thống backend thu được qua quá trình Reverse Engineering mã nguồn TypeScript.

---

## 1. Quan hệ Kế thừa & Hiện thực hóa (Inheritance & Realization)
*   **Agent Strategies**:
    *   `TravelAgent`, `FoodAgent`, `CultureAgent`, `RecommendationAgent` hiện thực hóa (`implements`) giao diện `AgentStrategy`.
*   **Agent Tools**:
    *   `MapTool`, `WeatherTool`, `FoodTool`, `CultureTool`, `RecommendationTool`, `ItineraryTool` kế thừa (`extends`) lớp cơ sở `BaseTool`.

## 2. Quan hệ Thành phần (Composition)
Các mối quan hệ vòng đời phụ thuộc chặt chẽ, các lớp con được khởi tạo trực tiếp trong hàm khởi tạo (constructor) của lớp cha:

*   **Dialogue Layer Composition**:
    *   `AgentExecutorService` chứa (`composed of`) các service:
        *   `AddressService`
        *   `ConversationStateService`
        *   `TravelRerankerService`
        *   `ResponsePlanner`
        *   `TravelIntentService`
        *   `SlotFillingService`
        *   `SuggestionBuilderService`
        *   `ResponseFormatterService`
*   **Chatbot CIM Composition**:
    *   `ConversationIntelligence` chứa các thành phần phân tích cảm xúc và luật:
        *   `EmotionAnalyzer`
        *   `ConversationStateMachine`
        *   `SlotPolicy`
        *   `ResponsePolicy`
        *   `RuleOverrideEngine`
*   **RAG Pipeline Composition**:
    *   `RagPipelineService` chứa toàn bộ các dịch vụ con của luồng xử lý tri thức:
        *   `EmbeddingsService`
        *   `VectorStoreService`
        *   `RetrieverService`
        *   `PromptBuilderService`
        *   `SemanticCacheService`
        *   `GuardrailsService`
        *   `FactVerifierService`
        *   `CitationGeneratorService`
        *   `KnowledgeRepository`

## 3. Quan hệ Kết hợp (Association / Aggregation)
Mối quan hệ tham chiếu giữa các Controller, Service và Repository của cùng một mô-đun:

*   **Kiến trúc Controller - Service - Repository tiêu chuẩn**:
    *   `SavedPlaceController` kết hợp với `SavedPlaceService`. `SavedPlaceService` kết hợp với `SavedPlaceRepository`.
    *   `FavoriteFoodController` kết hợp với `FavoriteFoodService`. `FavoriteFoodService` kết hợp với `FavoriteFoodRepository`.
    *   `ItineraryController` kết hợp với `ItineraryService`. `ItineraryService` kết hợp với `ItineraryRepository`.
    *   `TravelHistoryController` kết hợp với `TravelHistoryService`. `TravelHistoryService` kết hợp with `TravelHistoryRepository`.
    *   `RecommendationController` kết hợp với `RecommendationService`. `RecommendationService` kết hợp với `RecommendationRepository`.
    *   `ChatbotController` kết hợp với `ChatbotService`. `ChatbotService` kết hợp với `ChatbotRepository` và `ConversationIntelligence`.
    *   `RagController` kết hợp với `RagOrchestratorService`. `RagOrchestratorService` kết hợp với `RagPipelineService` và `RagAuditRepository`.
    *   `CacheController` kết hợp với `CacheService`. `CacheService` kết hợp với `CacheRepository`.
    *   `FeedbackController` kết hợp với `FeedbackService`. `FeedbackService` kết hợp với `FeedbackRepository`.
    *   `ToolCallController` kết hợp với `ToolCallService`. `ToolCallService` kết hợp với `ToolCallRepository`.

## 4. Quan hệ Phụ thuộc (Dependency)
*   **AI Agents & Tools Dependency**:
    *   `AgentExecutorService` phụ thuộc vào các Tool thực thi (`MapTool`, `WeatherTool`, v.v.) và tiêm (`inject`) chúng vào các `AgentStrategy` khi khởi tạo.
*   **Routers & DTOs/Entities Dependency**:
    *   `AuthRouter`, `TripsRouter`, `PostsRouter`, `MapRouter` phụ thuộc vào các interface DTO để kiểm tra dữ liệu đầu vào và các Class Entity để ánh xạ dữ liệu đầu ra từ Prisma.
