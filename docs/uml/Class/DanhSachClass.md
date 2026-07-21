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
*   **PostsRouter**: Bộ định tuyến Express xử lý các yêu cầu viết bài đăng, bình luận, tương tác thích và đánh dấu lưu bài đăng.
*   **Post**: Thực thể dữ liệu biểu diễn bài đăng chia sẻ trải nghiệm du lịch (bao gồm tác giả, nội dung, tệp hình ảnh/video).
*   **Comment**: Thực thể dữ liệu biểu diễn bình luận dưới các bài viết (hỗ trợ liên kết phân tầng `parentId` để trả lời bình luận khác).
*   **Like**: Thực thể dữ liệu lưu trữ lượt thích của người dùng đối với các bài đăng cụ thể.
*   **Bookmark**: Thực thể dữ liệu lưu trữ các bài đăng được người dùng đánh dấu để xem lại sau.

## 5. Map & Geocoding (Bản đồ & Địa lý)
*   **MapRouter**: Điều phối các API tìm kiếm địa điểm xung quanh, lấy chi tiết, geocoding và chia sẻ vị trí thực tế của người dùng.

## 6. Recommendations (Gợi ý du lịch)
*   **RecommendationController**: Quản lý các đề xuất địa điểm, nhà hàng và cập nhật sở thích người dùng.
*   **RecommendationService**: Nghiệp vụ tính toán và đề xuất địa điểm dựa trên profile sở thích.
*   **RecommendationRepository**: Truy vấn sở thích người dùng (`TravelPreferences`) và lịch sử đề xuất.

## 7. Chatbot & Dialogue Layer (Trợ lý ảo & Hội thoại)
*   **ChatbotController**: Bộ điều khiển tiếp nhận các API tạo cuộc trò chuyện, gửi tin nhắn, lấy lịch sử chat và quản lý bộ nhớ dài hạn của chatbot.
*   **ChatbotService**: Dịch vụ xử lý logic hội thoại chatbot, tích hợp máy trạng thái CIM và điều phối cuộc gọi đến AI Agent.
*   **ChatbotRepository**: Thao tác trực tiếp với cơ sở dữ liệu để lưu trữ lịch sử chat, các phiên bản tin nhắn và thông tin bộ nhớ AI (`AIMemory`).
*   **ConversationIntelligence**: Bộ xử lý trung tâm (CIM) phân tích cấu trúc câu hỏi, điều phối các module cảm xúc, trạng thái và luật trả lời.
*   **EmotionAnalyzer**: Bộ phân tích cảm xúc từ tin nhắn đầu vào (như chán nản, thất vọng, hài lòng, tức giận) để điều chỉnh tông giọng trả lời.
*   **ConversationStateMachine**: Bộ quản lý trạng thái hội thoại, chuyển đổi trạng thái dựa trên ý định của người dùng.
*   **SlotPolicy**: Chính sách xác định xem thông tin lịch trình đã được thu thập đủ chưa (slot-filling).
*   **ResponsePolicy**: Chính sách quyết định tông giọng và định dạng câu trả lời của AI phù hợp với cảm xúc người dùng.
*   **RuleOverrideEngine**: Bộ quy tắc ưu tiên để ghi đè các phản hồi chatbot trong các trường hợp đặc biệt hoặc khẩn cấp.
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
*   **AgentController**: Bộ điều khiển tiếp nhận yêu cầu trò chuyện trực tiếp với tác tử AI, lập kế hoạch hành trình và lấy trạng thái của Agent.
*   **AgentExecutorService**: Bộ điều phối cốt lõi chạy các tác tử AI chuyên biệt, chọn lựa Agent Strategy phù hợp và điều hướng gọi Tools.
*   **AddressService**: Dịch vụ chuẩn hóa địa chỉ địa lý thô của người dùng nhập vào để các công cụ tìm kiếm chính xác.
*   **AgentStrategy**: Giao diện chung thiết lập hành vi thực thi nhiệm vụ của các trợ lý ảo AI.
*   **TravelAgent**: Trợ lý Hanh trinh AI chuyên trách lập lịch trình chi tiết và tối ưu hóa tuyến đường du lịch.
*   **FoodAgent**: Trợ lý Am thuc AI chuyên giới thiệu đặc sản, nhà hàng và phân tích ẩm thực địa phương.
*   **CultureAgent**: Trợ lý Van hoa AI cung cấp thông tin về lịch sử, di tích và các lễ hội truyền thống địa phương.
*   **RecommendationAgent**: Trợ lý Goi y AI đưa ra các đề xuất du lịch cá nhân hóa dựa trên sở thích của người dùng.
*   **AgentTool**: Giao diện chung định nghĩa thuộc tính và phương thức thực thi của các công cụ gọi ngoài.
*   **MapTool**: Công cụ bản đồ dùng để định vị, tìm kiếm địa danh và lấy thông tin địa lý của destinations.
*   **WeatherTool**: Công cụ thời tiết dùng để truy vấn thông tin dự báo thời tiết của điểm đến theo ngày.
*   **FoodTool**: Công cụ ẩm thực dùng để tìm kiếm các quán ăn ngon và thông tin đặc sản.
*   **CultureTool**: Công cụ văn hóa dùng để tra cứu sự kiện, lễ hội và phong tục văn hóa vùng miền.
*   **RecommendationTool**: Công cụ gợi ý dùng để lấy danh sách địa điểm đề xuất phù hợp với profile người dùng.
*   **ItineraryTool**: Công cụ hành trình dùng để sinh dự thảo lịch trình du lịch dựa trên số ngày đi.

## 9. RAG (Kiến thức mở rộng)
*   **RagController**: Bộ điều khiển xử lý các API truy vấn kiến thức, nạp tài liệu tri thức mới và lấy nhật ký kiểm toán.
*   **RagOrchestratorService**: Bộ điều phối luồng RAG, tiếp nhận câu hỏi của người dùng và ghi nhật ký hoạt động kiểm toán RAG.
*   **RagPipelineService**: Luồng thực thi chi tiết của RAG bao gồm kiểm tra an toàn, truy xuất bộ đệm, tìm kiếm vector và xác minh sự thật.
*   **EmbeddingsService**: Dịch vụ gọi API OpenAI để mã hóa văn bản thô thành vector embedding 1536 chiều.
*   **VectorStoreService**: Thao tác trực tiếp với cơ sở dữ liệu Vector để tìm kiếm các đoạn văn bản có độ tương đồng cao.
*   **RetrieverService**: Dịch vụ truy xuất và lọc ra các tài liệu ngữ cảnh có giá trị tham khảo cao nhất cho câu hỏi.
*   **PromptBuilderService**: Bộ soạn câu hỏi cho AI, tích hợp ngữ cảnh tài liệu vừa truy xuất vào prompt của LLM.
*   **SemanticCacheService**: Bộ đệm ngữ nghĩa lưu giữ các cặp câu hỏi-trả lời cũ để tái sử dụng ngay nếu gặp câu hỏi tương tự.
*   **GuardrailsService**: Dịch vụ kiểm soát an toàn để chặn các câu hỏi độc hại đầu vào và lọc các câu trả lời nhạy cảm đầu ra.
*   **FactVerifierService**: Dịch vụ đối chiếu câu trả lời sinh ra của AI với tài liệu gốc để đảm bảo tính xác thực, tránh ảo tưởng AI (hallucination).
*   **CitationGeneratorService**: Dịch vụ sinh trích dẫn nguồn tài liệu tham khảo chính xác kèm theo câu trả lời cho người dùng.
*   **KnowledgeRepository**: Kho lưu trữ thao tác trực tiếp với cơ sở dữ liệu để truy xuất hoặc lưu mới các tài liệu tri thức thô.
*   **RagAuditRepository**: Kho lưu trữ ghi nhận vết hoạt động truy xuất RAG của hệ thống phục vụ giám sát và kiểm toán.

## 10. Cache & System (Bộ nhớ đệm & Hệ thống)
*   **CacheController**: Bộ điều khiển tiếp nhận các API lưu dữ liệu đệm, xóa đệm thủ công hoặc quét dọn dẹp bộ nhớ đệm.
*   **CacheService**: Dịch vụ xử lý logic bộ nhớ đệm, lưu và lấy cache theo thời gian hết hạn (TTL).
*   **CacheRepository**: Thao tác trực tiếp với cơ sở dữ liệu để ghi hoặc xóa các bản ghi cache (`PlaceCache`, `FoodCache`, `BlogCache`).
*   **FeedbackController**: Bộ điều khiển xử lý các API gửi, chỉnh sửa và lấy phản hồi đánh giá của người dùng về chatbot.
*   **FeedbackService**: Dịch vụ xử lý logic ghi nhận ý kiến đóng góp và đánh giá upvote/downvote.
*   **FeedbackRepository**: Thao tác trực tiếp với cơ sở dữ liệu đối với bảng `AIFeedback`.
*   **ToolCallController**: Bộ điều khiển tiếp nhận các yêu cầu tra cứu nhật ký gọi công cụ (tools) của AI Agents.
*   **ToolCallService**: Dịch vụ xử lý logic ghi nhận nhật ký hoạt động gọi công cụ.
*   **ToolCallRepository**: Thao tác trực tiếp với cơ sở dữ liệu đối với bảng `ToolCall`.
*   **TravelHistoryController**: Bộ điều khiển tiếp nhận các API tạo, xem, sửa, xóa nhật ký lịch sử đi lại thực tế của người dùng.
*   **TravelHistoryService**: Dịch vụ xử lý logic nghiệp vụ ghi nhận hành trình đã hoàn thành, chi tiêu thực tế và đánh giá.
*   **TravelHistoryRepository**: Thao tác trực tiếp với cơ sở dữ liệu đối với bảng `TravelHistory`.
