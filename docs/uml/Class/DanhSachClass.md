# Danh sách các Lớp & Interface trong Hệ thống Backend

Dưới đây là danh sách toàn bộ các lớp (Classes), giao diện (Interfaces) và cấu trúc dữ liệu chính trong hệ thống backend, được phân tách theo từng mô-đun chức năng cụ thể thu được từ quá trình kỹ nghệ ngược (Reverse Engineering).

---

## 1. Authentication (Xác thực)
*   **EmailService**: Dịch vụ xử lý gửi email xác thực tài khoản và khôi phục mật khẩu.
*   **AuthRequest**: Interface mở rộng của Express Request chứa thông tin của JWT Payload sau khi xác thực.

## 2. User, Profiles & Saved Collections (Người dùng & Bộ sưu tập)
*   **SavedPlaceController**: Tiếp nhận và điều phối các yêu cầu liên quan đến địa điểm đã lưu của người dùng.
*   **SavedPlaceService**: Chứa logic nghiệp vụ quản lý địa điểm đã lưu.
*   **SavedPlaceRepository**: Thao tác trực tiếp với cơ sở dữ liệu đối với bảng `SavedPlace`.
*   **FavoriteFoodController**: Quản lý các yêu cầu liên quan đến món ăn yêu thích.
*   **FavoriteFoodService**: Nghiệp vụ món ăn yêu thích.
*   **FavoriteFoodRepository**: Thao tác trực tiếp với bảng `FavoriteFood`.

## 3. Trips & Custom Itinerary (Chuyến đi & Hành trình)
*   **ItineraryController**: Điều phối các thao tác với hành trình tự thiết kế.
*   **ItineraryService**: Nghiệp vụ chỉnh sửa, cấu trúc lại hành trình từ chuyến đi.
*   **ItineraryRepository**: Thao tác trực tiếp với bảng `Itinerary`.
*   **TripsRouter**: Express Router định tuyến các hành động tạo, sửa, xóa chuyến đi và điều phối AI planner.

## 4. Social & Posts (Mạng xã hội & Bài viết)
*   **PostsRouter**: Định tuyến các yêu cầu liên quan đến viết bài đăng, bình luận, thả tim và lưu bài viết.
*   **Post / Comment / Like / Bookmark**: Các cấu trúc thực thể (Entity) đại diện cho dữ liệu mạng xã hội.

## 5. Map & Geocoding (Bản đồ & Địa lý)
*   **MapRouter**: Điều phối các API tìm kiếm địa điểm xung quanh, lấy chi tiết, geocoding và chia sẻ vị trí thực tế của người dùng.

## 6. Recommendations (Gợi ý du lịch)
*   **RecommendationController**: Quản lý các đề xuất địa điểm, nhà hàng và cập nhật sở thích người dùng.
*   **RecommendationService**: Nghiệp vụ tính toán và đề xuất địa điểm dựa trên profile sở thích.
*   **RecommendationRepository**: Truy vấn sở thích người dùng (`TravelPreferences`) và lịch sử đề xuất.

## 7. Chatbot & Dialogue Layer (Trợ lý ảo & Hội thoại)
*   **ChatbotController / ChatbotService / ChatbotRepository**: Tiếp nhận tin nhắn, truy xuất lịch sử trò chuyện và lưu feedback.
*   **ConversationIntelligence**: Module chính phân tích hội thoại (CIM).
*   **EmotionAnalyzer**: Phân tích cảm xúc người dùng (Bored, Frustrated, Disappointed, v.v.).
*   **ConversationStateMachine**: Máy trạng thái hội thoại.
*   **SlotPolicy / ResponsePolicy**: Quyết định slot filling và định dạng phản hồi phù hợp với ngữ cảnh và cảm xúc.
*   **RuleOverrideEngine**: Áp dụng các quy tắc ưu tiên hội thoại.
*   **Dialogue Layer Services**:
    *   `ConversationStateService`: Lưu giữ và cập nhật trạng thái hội thoại.
    *   `TravelIntentService`: Nhận dạng ý định hội thoại.
    *   `TravelRerankerService`: Xếp hạng lại điểm đến dựa trên sở thích.
    *   `SuggestionBuilderService`: Gợi ý các bước tiếp theo cho khách hàng.
    *   `SlotFillingService`: Trích xuất thông tin hành trình.
    *   `ResponsePlanner`: Lập kế hoạch cấu trúc câu trả lời.
    *   `ResponseFormatterService`: Định dạng nội dung hiển thị cho người dùng.
    *   `PromptComposerService`: Tạo prompt cho LLM kèm ngữ cảnh RAG.

## 8. AI Agents (Đại lý trí tuệ nhân tạo)
*   **AgentController**: API giao tiếp trực tiếp với hệ thống AI Agents.
*   **AgentExecutorService**: Lớp điều phối cốt lõi chạy các đại lý chuyên biệt.
*   **AddressService**: Chuẩn hóa địa chỉ địa lý phục vụ tìm kiếm.
*   **AgentStrategy**: Giao diện chung cho các đại lý.
*   **TravelAgent / FoodAgent / CultureAgent / RecommendationAgent**: Các đại lý chuyên biệt xử lý hành trình, ẩm thực, văn hóa và đề xuất.
*   **BaseTool / MapTool / WeatherTool / FoodTool / CultureTool / RecommendationTool / ItineraryTool**: Các công cụ được Agent sử dụng để thu thập dữ liệu thời gian thực.

## 9. RAG (Kiến thức mở rộng)
*   **RagController / RagOrchestratorService / RagPipelineService**: Tiếp nhận câu hỏi RAG, điều phối và thực thi luồng pipeline.
*   **EmbeddingsService**: Tạo vector embedding cho text.
*   **VectorStoreService**: Thực hiện tìm kiếm tương đồng vector trên CSDL.
*   **RetrieverService**: Truy xuất văn bản ngữ cảnh liên quan nhất.
*   **PromptBuilderService**: Xây dựng prompt chứa tài liệu tham khảo.
*   **SemanticCacheService**: Bộ đệm ngữ nghĩa tối ưu hóa chi phí LLM.
*   **GuardrailsService**: Kiểm soát an toàn đầu vào và đầu ra.
*   **FactVerifierService**: Xác minh tính xác thực, tránh Hallucination.
*   **CitationGeneratorService**: Tự động tạo trích dẫn tài liệu nguồn.
*   **KnowledgeRepository / RagAuditRepository**: Quản lý tri thức và kiểm toán hoạt động RAG.

## 10. Cache & System (Bộ nhớ đệm & Hệ thống)
*   **CacheController / CacheService / CacheRepository**: Module đệm dữ liệu tối ưu hiệu năng hệ thống.
*   **FeedbackController / FeedbackService / FeedbackRepository**: Quản lý ý kiến phản hồi về hệ thống và bài đăng.
*   **ToolCallController / ToolCallService / ToolCallRepository**: Kiểm toán vết gọi tool của các AI Agent.
*   **TravelHistoryController / TravelHistoryService / TravelHistoryRepository**: Lưu vết các chuyến đi thực tế của người dùng.
