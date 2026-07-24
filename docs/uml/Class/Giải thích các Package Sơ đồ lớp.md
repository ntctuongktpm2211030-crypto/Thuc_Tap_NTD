# Tài liệu Giải thích các Package Sơ đồ Lớp (UML Class Diagrams Package Guide)

Tài liệu này cung cấp phần giải thích chi tiết bằng tiếng Việt về mục đích, chức năng, danh sách lớp, quan hệ liên kết và vai trò của từng **Package** trong hệ thống sơ đồ lớp UML. Tài liệu này được biên soạn theo chuẩn học thuật phục vụ trực tiếp cho báo cáo khóa luận tốt nghiệp.

---

# Package: Xu ly Dang nhap Dang ky (Authentication Module)

## Mục đích
Quản lý toàn bộ vòng đời xác thực của người dùng, bao gồm đăng ký, đăng nhập, bảo mật phiên làm việc và gửi email thông báo bảo mật.

## Chức năng
*   Đăng ký và xác thực tài khoản qua Email/Google.
*   Quản lý vòng đời và làm mới JWT Tokens (Access Token / Refresh Token).
*   Cấp quyền, phân quyền và kiểm soát bảo mật thông qua Middleware.
*   Xử lý quy trình khôi phục và đặt lại mật khẩu của người dùng.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Dang Nhap Dang Ky (AuthRouter)** | Bộ định tuyến Express xử lý các yêu cầu đăng ký, đăng nhập, xác thực và quên mật khẩu. |
| **Kiem Tra Dang Nhap (AuthMiddleware)** | Bộ kiểm tra tính hợp lệ của Token JWT và phân quyền người dùng truy cập. |
| **Dich Vu Gui Email (EmailService)** | Dịch vụ gửi email xác thực tài khoản và email khôi phục mật khẩu. |
| **Yeu Cau Xac Thuc (AuthRequest)** | Định nghĩa thông tin người dùng đăng nhập đính kèm vào dữ liệu yêu cầu (Request). |

## Quan hệ với package khác
Sơ đồ quan hệ dạng text:
```text
AuthRouter
 ├── EmailService (gửi email bảo mật)
 └── AuthRequest (chứa thông tin phiên đăng nhập)
AuthMiddleware
 └── AuthRequest (xác thực và đính kèm thông tin user)
```

## Vai trò trong hệ thống
Chịu trách nhiệm bảo mật cổng vào hệ thống, ngăn chặn các truy cập trái phép và bảo vệ tài nguyên dữ liệu của người dùng.

---

# Package: Xu ly Chuyen di du lich (Trips Module)

## Mục đích
Cung cấp các API nghiệp vụ để người dùng quản lý chuyến đi, lập lịch trình chi tiết và tối ưu hóa tuyến đường du lịch.

## Chức năng
*   Tạo mới, sao chép, chỉnh sửa và xóa thông tin chuyến đi.
*   Tự động khởi tạo lịch trình du lịch bằng trí tuệ nhân tạo (AI).
*   Tối ưu hóa thứ tự các điểm đến trên bản đồ nhằm tiết kiệm quãng đường di chuyển.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Chuyen Di (TripsRouter)** | Tiếp nhận và điều phối các yêu cầu tạo, sửa, xóa, sao chép và tối ưu chuyến đi. |
| **Thong Tin Tao Chuyen Di (CreateTripDto)** | Định nghĩa cấu trúc dữ liệu bắt buộc khi người dùng tạo mới một hành trình. |
| **Thong Tin Cap Nhat Chuyen Di (UpdateTripDto)** | Định nghĩa cấu trúc các trường thông tin cho phép cập nhật của chuyến đi. |

## Quan hệ với package khác
```text
TripsRouter
 ├── CreateTripDto (kiểm tra định dạng đầu vào)
 └── UpdateTripDto (kiểm tra định dạng đầu sửa)
```

## Vai trò trong hệ thống
Là module nghiệp vụ cốt lõi quản lý thực thể hành trình du lịch - trung tâm kết nối của toàn bộ ứng dụng.

---

# Package: Xu ly Bai dang va Binh luan (Posts Module)

## Mục đích
Quản lý các bài viết chia sẻ trải nghiệm chuyến đi, ảnh chụp và các tương tác cộng đồng.

## Chức năng
*   Đăng tải bài viết kèm danh sách hình ảnh và thông tin địa điểm.
*   Tương tác cộng đồng thông qua cơ chế Thích (Like) và Đánh dấu lưu trữ (Bookmark).
*   Bình luận và thảo luận phân cấp dưới các bài đăng.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Bai Dang va Binh Luan (PostsRouter)** | Định tuyến yêu cầu lấy danh sách bài đăng, bình luận và cập nhật tương tác của người dùng. |

## Quan hệ với package khác
```text
PostsRouter
 ├── User Entities (truy vấn tác giả bài viết)
 └── Trip Entities (truy vấn chuyến đi được chia sẻ)
```

## Vai trò trong hệ thống
Đóng vai trò là cổng giao tiếp và định tuyến cho phân hệ mạng xã hội của nền tảng du lịch.

---

# Package: Xu ly Ban do va GIS (Map Module)

## Mục đích
Cung cấp các dịch vụ bản đồ số, tìm kiếm địa điểm và định vị vị trí địa lý của người dùng.

## Chức năng
*   Tìm kiếm địa điểm du lịch, khách sạn và nhà hàng theo từ khóa.
*   Chuyển đổi địa chỉ thường thành tọa độ GPS (Geocoding) và ngược lại (Reverse Geocoding).
*   Cập nhật tọa độ thời gian thực và định vị người dùng lân cận.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Ban Do (MapRouter)** | Định tuyến yêu cầu tìm kiếm, định vị và geocoding địa lý. |

## Quan hệ với package khác
```text
MapRouter
 └── Destination (ánh xạ tìm kiếm tới thực thể địa danh trong DB)
```

## Vai trò trong hệ thống
Cung cấp nền tảng bản đồ không gian địa lý trực quan cho toàn bộ các chức năng lập lịch trình.

---

# Package: Recommendations Module

## Mục đích
Xây dựng và phân tích các gợi ý điểm đến cá nhân hóa cho từng người dùng dựa trên lịch sử và hành vi du lịch.

## Chức năng
*   Tính toán điểm số gợi ý và lý do đề xuất địa danh phù hợp.
*   Quản lý và cập nhật hồ sơ sở thích du lịch (TravelPreferences) của người dùng.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **RecommendationController**| Điều phối yêu cầu lấy và cập nhật danh sách gợi ý của người dùng. |
| **RecommendationService** | Thực thi logic lọc địa điểm gợi ý và cập nhật hồ sơ sở thích. |
| **RecommendationRepository** | Tương tác trực tiếp với CSDL để truy vấn thông tin gợi ý và sở thích du lịch. |

## Quan hệ với package khác
```text
RecommendationController
 └── RecommendationService
      └── RecommendationRepository
           └── TravelPreferences (thực thể CSDL của sở thích)
```

## Vai trò trong hệ thống
Giữ vai trò phân tích thông minh, giúp cá nhân hóa trải nghiệm du lịch cho từng khách hàng.

---

# Package: Xu ly Chat bot va Hoi thoai (Chatbot & Dialogue Layer)

## Mục đích
Quản lý logic hội thoại thông minh của trợ lý ảo AI, điều phối trạng thái trò chuyện và xử lý ngữ cảnh ngôn ngữ tự nhiên.

## Chức năng
*   Phân tích cảm xúc người dùng (Emotion Analysis) và phân loại ý định du lịch (Intent Classification).
*   Quản lý máy trạng thái hội thoại (Conversation State Machine) để dẫn dắt trò chuyện tự nhiên.
*   Trích xuất thông tin lịch trình (Slot Filling) và lập kế hoạch phản hồi tối ưu.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Xu Ly Yeu Cau Chatbot (ChatbotController)** | Tiếp nhận yêu cầu trò chuyện, gửi tin nhắn và quản lý luồng chat trợ lý ảo. |
| **Dich Vu Xu Ly Chatbot (ChatbotService)** | Điều phối luồng xử lý tin nhắn, lưu trữ lịch sử hội thoại và gọi tích hợp các Agent/RAG. |
| **ChatbotRouter** | Bộ định tuyến Express điều phối các endpoint hội thoại và AI Memory. |

## Quan hệ với package khác
```text
ChatbotRouter
 └── ChatbotController
      └── ChatbotService
           ├── User (liên kết hội thoại)
           └── Conversation (thực thể lưu vết DB)
```

## Vai trò trong hệ thống
Là trung tâm xử lý trí tuệ nhân tạo (Conversational AI), quyết định sự thông minh và mức độ thấu hiểu cảm xúc của trợ lý ảo.

---

# Package: Dieu hanh cac Tro ly AI (AI Agents Module)

## Mục đích
Quản lý các đại lý AI chuyên biệt (AI Agents) và các công cụ (Tools) mà chúng có quyền gọi để thực hiện tác vụ tự động.

## Chức năng
*   Lập kế hoạch hành động đa bước (Multi-step Planning) dựa trên yêu cầu người dùng.
*   Ủy thác tác vụ cho các Agent chuyên sâu về: Hành trình, Ẩm thực, Văn hóa hoặc Đề xuất.
*   Gọi các công cụ ngoài để lấy thông tin thời tiết, bản đồ hoặc lên lịch trình.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **AgentController** | Cung cấp API tương tác với đại lý AI và lấy trạng thái thực thi hiện tại. |
| **AgentExecutorService** | Bộ thực thi trung tâm điều phối các chiến lược đại lý và gọi dịch vụ liên quan. |
| **AddressService** | Tiện ích chuẩn hóa và phân tích cú pháp địa chỉ địa lý cho các Agent. |
| **AgentStrategy** | Giao diện chung định nghĩa hành vi thực thi của mọi Agent. |
| **TravelAgent** | Đại lý chuyên trách lập và tinh chỉnh lịch trình chuyến đi chi tiết. |
| **FoodAgent** | Đại lý chuyên trách tìm kiếm, phân tích và gợi ý món ăn bản địa. |
| **CultureAgent** | Đại lý chuyên tìm hiểu và giới thiệu thông tin văn hóa, lễ hội vùng miền. |
| **RecommendationAgent** | Đại lý chuyên về cá nhân hóa gợi ý cho người dùng. |
| **AgentTool** | Giao diện chung định nghĩa thuộc tính và phương thức thực thi của các công cụ. |
| **MapTool** | Công cụ dùng để định vị, tìm kiếm địa danh và lấy thông tin bản đồ phục vụ lập lịch. |
| **WeatherTool** | Công cụ dùng để tra cứu thông tin thời tiết thời gian thực tại địa điểm du lịch. |
| **FoodTool** | Công cụ tra cứu ẩm thực bản địa, đặc sản và các quán ăn ngon nhất. |
| **CultureTool** | Công cụ tra cứu lịch sử, sự kiện văn hóa, phong tục và lễ hội bản địa. |
| **RecommendationTool** | Công cụ truy vấn sở thích người dùng để Agent cá nhân hóa đề xuất. |
| **ItineraryTool** | Công cụ hỗ trợ Agent tạo trực tiếp các hoạt động chuyến đi vào cơ sở dữ liệu. |

## Quan hệ với package khác
```text
AgentController
 └── AgentExecutorService
      └── AgentStrategy (Interface)
           ├── TravelAgent (sử dụng ItineraryTool, MapTool, WeatherTool)
           ├── FoodAgent (sử dụng FoodTool)
           ├── CultureAgent (sử dụng CultureTool)
           └── RecommendationAgent (sử dụng RecommendationTool)
```

## Vai trò trong hệ thống
Cung cấp khả năng tự động hóa hành động (Actionable AI), giúp chatbot không chỉ biết nói chuyện mà còn thực sự thực hiện được các tác vụ nghiệp vụ phức tạp.

---

# Package: RAG & Knowledge Module

## Mục đích
Quản lý kho tri thức của hệ thống và xây dựng luồng tìm kiếm nâng cao (Retrieval-Augmented Generation) nhằm đảm bảo câu trả lời của AI luôn chính xác và có nguồn trích dẫn đáng tin cậy.

## Chức năng
*   Truy xuất các đoạn văn bản tri thức liên quan nhất dựa trên độ tương đồng Vector (Similarity Search).
*   Kiểm soát an toàn thông tin đầu vào/đầu ra (Guardrails) để lọc từ ngữ độc hại.
*   Xác minh sự thật (Fact Verification) chống hiện tượng AI "ảo tưởng" (hallucination) và tự động tạo trích nguồn (Citations).

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **RagController** | Định tuyến yêu cầu truy vấn tri thức, cập nhật tài liệu và kiểm tra nhật ký. |
| **RagOrchestratorService**| Bộ điều phối luồng RAG và ghi nhật ký kiểm toán hệ thống. |
| **RagPipelineService** | Quản lý quy trình Pipeline RAG tuần tự từ Embeddings, Retrieve đến Verify. |
| **Quản lý RAG (RagController)** | Định tuyến yêu cầu truy vấn tri thức, cập nhật tài liệu và kiểm tra nhật ký. |
| **Điều phối RAG (RagOrchestratorService)**| Bộ điều phối luồng RAG và ghi nhật ký kiểm toán hệ thống. |
| **Quy trình RAG (RagPipelineService)** | Quản lý quy trình Pipeline RAG tuần tự từ Embeddings, Retrieve đến Verify. |
| **Dịch vụ Embeddings (EmbeddingsService)** | Dịch vụ gọi mô hình Vector hóa văn bản thô. |
| **Dịch vụ Vector (VectorStoreService)** | Tương tác với CSDL Vector (PostgreSQL pgvector) để tìm tài liệu tương đồng. |
| **Dịch vụ truy xuất (RetrieverService)** | Thực hiện lọc và xếp hạng các tài liệu liên quan nhất. |
| **Xây dựng Prompt (PromptBuilderService)** | Kết hợp câu hỏi của người dùng và ngữ cảnh tri thức thành Prompt hoàn chỉnh. |
| **Cache ngữ nghĩa (SemanticCacheService)** | Cache ngữ nghĩa để phản hồi ngay các câu hỏi trùng lặp mà không cần gọi LLM. |
| **Dịch vụ kiểm soát (GuardrailsService)** | Hệ thống rào chắn bảo vệ ngăn chặn Prompt Injection và ngôn từ không phù hợp. |
| **Xác minh sự thật (FactVerifierService)** | Đối chiếu câu trả lời sinh ra với ngữ cảnh tri thức để kiểm chứng sự thật. |
| **Tạo trích nguồn (CitationGeneratorService)**| Tạo các liên kết trích nguồn trực quan đính kèm vào câu trả lời của AI. |
| **Lưu trữ tri thức (KnowledgeRepository)** | Kho lưu trữ thông tin tri thức thô trong CSDL. |
| **Kiểm toán RAG (RagAuditRepository)** | Ghi nhật ký kiểm toán hoạt động của RAG phục vụ giám sát hiệu năng. |

## Quan hệ với package khác
```text
RagController
 └── RagOrchestratorService
      ├── RagPipelineService
      │    ├── EmbeddingsService -> VectorStoreService (pgvector)
      │    ├── SemanticCacheService -> GuardrailsService
      │    └── FactVerifierService -> CitationGeneratorService
      └── RagAuditRepository
```

## Vai trò trong hệ thống
Đóng vai trò là lá chắn bảo vệ độ tin cậy của thông tin (Grounding & Truthfulness), ngăn chặn chatbot trả lời sai lệch thông tin địa danh, văn hóa.

---

# Package: Phan he Phan hoi tu Nguoi dung (Feedback Module)

## Mục đích
Quản lý việc thu thập phản hồi của người dùng về chất lượng dịch vụ và tính năng ứng dụng.

## Chức năng
*   Ghi nhận đánh giá sao, ý kiến đóng góp của người dùng.
*   Tính toán thống kê mức độ hài lòng phục vụ cải tiến hệ thống.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Phan Hoi (FeedbackController)** | Tiếp nhận yêu cầu gửi và thống kê phản hồi của người dùng. |
| **Dich Vu Phan Hoi (FeedbackService)** | Xử lý logic ghi nhận và phân tích dữ liệu thống kê. |
| **Luu Tru Phan Hoi (FeedbackRepository)** | Ghi nhận thông tin phản hồi vào cơ sở dữ liệu. |

## Quan hệ với package khác
```text
FeedbackController
 └── FeedbackService
      └── FeedbackRepository
           └── UserFeedback (thực thể CSDL tương ứng)
```

## Vai trò trong hệ thống
Hỗ trợ thu thập dữ liệu đánh giá và trải nghiệm người dùng thực tế để cải tiến chất lượng phản hồi AI.

---

# Package: Phan he Bo nho tam (Cache Module)

## Mục đích
Quản lý bộ nhớ đệm hiệu năng cao của hệ thống để giảm tải cho cơ sở dữ liệu chính và tăng tốc phản hồi API.

## Chức năng
*   Lưu trữ các truy vấn CSDL nặng và dữ liệu phiên làm việc ngắn hạn.
*   Quản lý thời gian sống của khóa (TTL) và thu dọn bộ nhớ đệm tự động.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Bo Nho Tam (CacheController)** | Cung cấp các công cụ quản trị cache (xem danh sách khóa, xóa cache). |
| **Dich Vu Bo Nho Tam (CacheService)** | Thực thi logic đọc, lưu và kiểm tra tính hợp lệ của cache. |
| **Luu Tru Bo Nho Tam (CacheRepository)** | Kết nối trực tiếp tới Redis hoặc vùng nhớ cache vật lý của hệ thống. |

## Quan hệ với package khác
```text
CacheController
 └── CacheService
      └── CacheRepository
```

## Vai trò trong hệ thống
Tối ưu hóa hiệu năng và tốc độ phản hồi của toàn bộ hệ thống dưới tải lớn.

---



# Package: Phan he Lich su di du lich (Travel History Module)

## Mục đích
Quản lý lịch sử các địa danh mà người dùng đã thực sự ghé thăm trong quá khứ.

## Chức năng
*   Tạo, sửa, xóa nhật ký lịch sử du lịch cá nhân.
*   Ghi nhận chi phí và đánh giá cá nhân cho từng điểm đến đã đi.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Lich Su Di Du Lich (TravelHistoryController)** | Tiếp nhận yêu cầu quản lý lịch sử du lịch của người dùng. |
| **Dich Vu Lich Su Di Du Lich (TravelHistoryService)** | Thực thi nghiệp vụ kiểm tra và cập nhật vết lịch sử. |
| **Luu Tru Lich Su Di Du Lich (TravelHistoryRepository)** | Truy vấn và ghi nhận dữ liệu lịch sử vào database. |

## Quan hệ với package khác
```text
TravelHistoryController
 └── TravelHistoryService
      └── TravelHistoryRepository
           └── Destination (liên kết với địa danh đã ghé thăm)
```

## Vai trò trong hệ thống
Lưu giữ hồ sơ dấu chân du lịch của khách hàng làm đầu vào phân tích sở thích cho AI.

---

# Package: Phan he Hanh trinh tu do (Itinerary Module)

## Mục đích
Quản lý các bài viết chi tiết dạng nhật ký hành trình (Journey) kèm theo bản đồ GPS của chuyến đi.

## Chức năng
*   Tạo viết nhật ký hành trình du lịch dạng câu chuyện có hình ảnh đi kèm.
*   Quản lý các cung đường và điểm mốc GPS trên bản đồ của hành trình.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Hanh Trinh Tu Do (ItineraryController)** | Định tuyến yêu cầu tạo, sửa, xóa nhật ký hành trình. |
| **Dich Vu Hanh Trinh Tu Do (ItineraryService)** | Điều phối logic cập nhật nhật ký và tọa độ các tuyến đường. |
| **Luu Tru Hanh Trinh Tu Do (ItineraryRepository)** | Ghi nhận dữ liệu hành trình vào cơ sở dữ liệu. |

## Quan hệ với package khác
```text
ItineraryController
 └── ItineraryService
      └── ItineraryRepository
           └── Journey (thực thể CSDL của nhật ký hành trình)
```

## Vai trò trong hệ thống
Cho phép người dùng tạo ra các bài blog du lịch chất lượng cao tích hợp GPS động.

---

# Package: Phan he Luu vet goi tool (Tool Calls Module)

## Mục đích
Quản lý việc ghi nhật ký và kiểm toán toàn bộ các hành động kích hoạt công cụ của AI Agent.

## Chức năng
*   Lưu trữ tham số đầu vào và kết quả đầu ra của từng lời gọi công cụ.
*   Kiểm toán hoạt động để phát hiện lỗi thực thi của Agent.

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Chuc Nang Goi Tool (ToolCallController)** | Cung cấp các API truy xuất vết cuộc gọi công cụ. |
| **Dich Vu Goi Tool (ToolCallService)** | Thực thi nghiệp vụ kiểm tra tính hợp lệ của cuộc gọi. |
| **Luu Tru Goi Tool (ToolCallRepository)** | Lưu vết cuộc gọi vào CSDL. |

## Quan hệ với package khác
```text
ToolCallController
 └── ToolCallService
      └── ToolCallRepository
           └── ToolCall (thực thể CSDL tương ứng)
```

## Vai trò trong hệ thống
Phục vụ công tác kiểm toán chất lượng vận hành của AI (AI Observability).

---

# Package: Du lieu Nguoi dung va Ca nhan hoa (User Entities)

## Mục đích
Đặc tả các thực thể miền dữ liệu (Domain Entities) liên quan trực tiếp đến thông tin cá nhân và tài khoản người dùng trong CSDL.

## Chức năng
*   Lưu trữ thông tin tài khoản, thông tin cá nhân (Profile).
*   Lưu trữ sở thích du lịch (TravelPreferences) và bộ nhớ cá nhân hóa AI (AIMemory).
*   Quản lý quan hệ bạn bè, theo dõi (Follower) và thông báo hệ thống (Notification).

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Du Lieu Nguoi Dung (User)** | Thực thể đại diện cho tài khoản đăng nhập chính của người dùng. |
| **Du Lieu Ca Nhan (Profile)** | Thực thể lưu thông tin cá nhân mở rộng (ảnh đại diện, tên, bio). |
| **So Thich Du Lich (TravelPreferences)** | Thực thể lưu trữ các sở thích du lịch tĩnh do người dùng tự khai báo. |
| **Bo Nao AI (AIMemory)** | Thực thể lưu trữ bộ nhớ động do AI tự động đúc rút qua các cuộc hội thoại. |
| **Du Lieu Theo Doi (Follower)** | Thực thể biểu diễn quan hệ nhiều-nhiều tự tham chiếu của người theo dõi. |
| **Du Lieu Thong Bao (Notification)** | Thực thể lưu trữ các thông báo gửi đến người dùng. |

## Quan hệ với package khác
```text
User
 ├── Profile (quan hệ 1-1)
 ├── TravelPreferences (quan hệ 1-1)
 ├── AIMemory (quan hệ 1-1)
 ├── Notification (quan hệ 1-nhiều)
 └── Follower (quan hệ nhiều-nhiều tự liên kết)
```

## Vai trò trong hệ thống
Là nền tảng nhận dạng thực thể cốt lõi, quản lý định danh người dùng trong toàn bộ CSDL.

---

# Package: Du lieu Hanh trinh va Dia diem (Trip Entities)

## Mục đích
Đặc tả các thực thể miền dữ liệu liên quan trực tiếp đến thông tin chuyến đi, hoạt động hàng ngày và thông tin địa danh trong CSDL.

## Chức năng
*   Lưu trữ chuyến đi (Trip), ngày đi (TripDay) và các hoạt động chi tiết (TripActivity).
*   Quản lý danh sách địa danh (Destination), địa điểm đã lưu (SavedPlace) và món ăn yêu thích (FavoriteFood).

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Du Lieu Chuyen Di (Trip)** | Thực thể đại diện cho một chuyến đi cụ thể của người dùng. |
| **Ngay Chuyen Di (TripDay)** | Thực thể đại diện cho một ngày cụ thể nằm trong chuyến đi. |
| **Hoat Dong Chuyen Di (TripActivity)** | Thực thể chi tiết một hoạt động cụ thể (tham quan, ăn uống, di chuyển). |
| **Du Lieu Diem Den (Destination)** | Thực thể đại diện cho một địa danh/địa điểm có trên bản đồ hệ thống. |
| **Du Lieu Dia Diem Da Luu (SavedPlace)** | Thực thể lưu trữ các địa điểm do người dùng tự đánh dấu lưu lại. |
| **Du Lieu Mon An Yeu Thich (FavoriteFood)** | Thực thể lưu các món ăn yêu thích do người dùng tự lưu giữ. |

## Quan hệ với package khác
```text
Trip
 └── TripDay (quan hệ 1-nhiều)
      └── TripActivity (quan hệ 1-nhiều)
           └── Destination (quan hệ nhiều-1)
```

## Vai trò trong hệ thống
Định nghĩa cấu trúc dữ liệu vật lý cho phân hệ quản lý hành trình di chuyển và bản đồ.

---

# Package: Du lieu Bai dang va Tuong tac (Post Entities)

## Mục đích
Đặc tả các thực thể miền dữ liệu liên quan đến bài viết và các tương tác của người dùng trên Bảng tin mạng xã hội.

## Chức năng
*   Lưu trữ nội dung bài viết và đường dẫn hình ảnh (Post).
*   Lưu trữ bình luận (Comment), lượt thích (Like) và đánh dấu bài viết (Bookmark).

## Các lớp trong package

| Class | Ý nghĩa |
| :--- | :--- |
| **Du Lieu Bai Dang (Post)** | Thực thể đại diện cho một bài viết được đăng tải trên Bảng tin. |
| **Du Lieu Binh Luan (Comment)** | Thực thể lưu trữ bình luận dưới bài viết (hỗ trợ bình luận phân cấp parentId). |
| **Du Lieu Luot Thich (Like)** | Thực thể lưu vết tương tác thích bài viết. |
| **Du Lieu Luot Luu (Bookmark)** | Thực thể lưu vết đánh dấu bài viết của người dùng. |

## Quan hệ với package khác
```text
Post
 ├── Comment (quan hệ 1-nhiều, có self-relation)
 ├── Like (quan hệ 1-nhiều)
 └── Bookmark (quan hệ 1-nhiều)
```

## Vai trò trong hệ thống
Định nghĩa cấu trúc dữ liệu vật lý cho phân hệ mạng xã hội và chia sẻ cộng đồng của ứng dụng.

---

# Tổng quan kiến trúc

## Tại sao chia thành nhiều package?
Hệ thống được thiết kế theo hướng **Domain-Driven Design (DDD)** kết hợp mô hình kiến trúc phân lớp Monolith truyền thống. Việc phân chia thành 17 package nhỏ giúp:
1.  **Cô lập sự thay đổi**: Tránh hiện tượng thay đổi code ở một module (như Chatbot AI) ảnh hưởng trực tiếp tới module khác (như Xác thực).
2.  **Dễ dàng bảo trì & kiểm thử**: Các lập trình viên có thể làm việc song song trên các module độc lập mà không gặp xung đột mã nguồn lớn.
3.  **Tường minh cấu trúc báo cáo**: Rất phù hợp để trình bày trong báo cáo khóa luận tốt nghiệp, giúp hội đồng đánh giá cao tư duy kiến trúc của sinh viên.

## Phân nhóm vai trò các Package trong hệ thống

### A. Nhóm Domain chính (Core Domain Models)
Định nghĩa cấu trúc dữ liệu bền vững cốt lõi trong CSDL phục vụ lưu trữ nghiệp vụ chính:
*   `Du lieu Nguoi dung va Ca nhan hoa (User Entities)`
*   `Du lieu Hanh trinh va Dia diem (Trip Entities)`
*   `Du lieu Bai dang va Tuong tac (Post Entities)`

### B. Nhóm nghiệp vụ hành trình (Trip Module)
Tiếp nhận và điều hành trực tiếp các hoạt động lập lịch và quản lý lịch sử đi lại:
*   `Xu ly Chuyen di du lich (Trips Module)`
*   `Phan he Hanh trinh tu do (Itinerary Module)`
*   `Phan he Lich su di du lich (Travel History Module)`

### C. Nhóm tương tác & mạng xã hội (Social Module)
Xử lý tương tác cộng đồng, bản đồ địa lý và chia sẻ bài đăng:
*   `Xu ly Bai dang va Binh luan (Posts Module)`
*   `Xu ly Ban do va GIS (Map Module)`
*   `Phan he Phan hoi tu Nguoi dung (Feedback Module)`

### D. Nhóm Trí tuệ Nhân tạo & Tri thức (AI & RAG Module)
Nơi tập hợp toàn bộ bộ não xử lý thông minh của chatbot và RAG:
*   `Xu ly Chat bot va Hoi thoai (Chatbot & Dialogue Layer)`
*   `Dieu hanh cac Tro ly AI (AI Agents Module)`
*   `Luong tim kiem du lieu Ca Mau (RAG & Knowledge Module)`
*   `Phan he Luu vet goi tool (Tool Calls Module)`

### E. Nhóm tiện ích hệ thống (System Infrastructure)
Các dịch vụ nền tảng giúp tăng tốc và bảo mật hệ thống:
*   `Xu ly Dang nhap Dang ky (Authentication Module)`
*   `Phan he Bo nho tam (Cache Module)`

---

## Bảng tổng kết vai trò các Package

| Tên Package (UML Display Label) | Phân nhóm Chức năng | Vai trò trong hệ thống |
| :--- | :--- | :--- |
| **Xu ly Dang nhap Dang ky (Authentication Module)** | Bao mat he thong | Kiem tra dang nhap, phan quyen truy cap API bang JWT. |
| **Xu ly Chuyen di du lich (Trips Module)** | Lap lich trinh | Xay dung chuyen di, len lich trinh du lich va toi uu hoa duong di. |
| **Xu ly Bai dang va Binh luan (Posts Module)** | Mang xa hoi | Viet bai dang, binh luan, thich va luu tru bai viet. |
| **Xu ly Ban do va GIS (Map Module)** | Ban do | Dinh vi vi tri, check-in va tim ban be xung quanh. |
| **Phan he Goi y Dia diem (Recommendations Module)** | Goi y thong minh | De xuat dia diem an uong, vui choi phu hop voi so thich. |
| **Xu ly Chat bot va Hoi thoai (Chatbot & Dialogue Layer)** | Hoi thoai AI | Doc cam xuc khach hang, phan tich y dinh va tra loi chat. |
| **Dieu hanh cac Tro ly AI (AI Agents Module)** | Tro ly tu dong | Dieu hanh cac tro ly hanh trinh, am thuc, van hoa va goi y. |
| **Luong tim kiem du lieu Ca Mau (RAG & Knowledge Module)** | Kho tri thuc | Truoc va lay thong tin chuan xac ve Ca Mau tu kho sach. |
| **Phan he Phan hoi tu Nguoi dung (Feedback Module)** | Danh gia dong gop | Thu thap danh gia cua nguoi dung ve cau tra loi cua AI. |
| **Phan he Bo nho tam (Cache Module)** | Bo nho tam | Luu tru tam thoi cac du lieu nang de he thong chay nhanh hon. |
| **Phan he Lich su di du lich (Travel History Module)** | Lich su di lai | Luu nhat ky nhung diem ma du khach da thuc su di qua. |
| **Phan he Hanh trinh tu do (Itinerary Module)** | Lich trinh tu chon | Nguoi dung tu sap xep lich trinh rieng khong theo ban do thô. |
| **Phan he Luu vet goi tool (Tool Calls Module)** | Nhat ky AI | Luu lai cac lan AI tu dong goi cong cu map, thoi tiet, RAG. |
| **Du lieu Nguoi dung va Ca nhan hoa (User Entities)** | Du lieu nguoi dung | Luu tru thong tin dang nhap, thong tin ca nhan va so thich. |
| **Du lieu Hanh trinh va Dia diem (Trip Entities)** | Du lieu chuyen di | Luu tru thong tin chuyen di, ngay di, hoat dong, diem den va mon an. |
| **Du lieu Bai dang va Tuong tac (Post Entities)** | Du lieu tuong tac | Luu tru thong tin bai viet, binh luan, thich va danh dau. |

