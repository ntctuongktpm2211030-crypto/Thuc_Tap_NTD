# BÁO CÁO KIỂM TRA VÀ ĐỐI CHIẾU HỆ THỐNG SƠ ĐỒ UML (ERD & USE CASE)

*Tác giả: Principal AI Architect / Technical Review Board*  
*Mục đích: Đối chiếu hệ thống sơ đồ UML trong `docs/uml/ERD` và `docs/uml/usecase` với cơ sở dữ liệu vật lý (schema.prisma) và API thực tế.*

---

## 1. TỔNG QUAN PHÁT HIỆN KIỂM TOÁN (EXECUTIVE SUMMARY)

Qua đối chiếu chéo giữa **Lược đồ CSDL vật lý** (`schema.prisma`) và **Mã nguồn Backend** với **các tài liệu/sơ đồ UML**, Hội đồng TRB phát hiện một số khoảng cách (Gaps) lớn cần được cập nhật để hồ sơ thiết kế khớp 100% với hệ thống thực tế đang chạy:

1. **Về Lược đồ ERD**:
   * **Thực thể ảo (Hallucinated Entities)**: Các sơ đồ cũ vẫn liệt kê `Itinerary`, `ItineraryDay`, `ItineraryActivity` (Lịch trình AI nháp) và `PlaceCache`, `FoodCache`, `BlogCache` là các bảng vật lý độc lập. Thực tế, chúng đã được gộp lại thành `Trip`, `TripDay`, `TripActivity` (dùng trạng thái `TripStatus` để phân loại) và `SystemCache` để tối ưu hóa hiệu năng.
   * **Thiếu hụt phân hệ AI Governance**: 10 bảng CSDL mới phục vụ quản trị AI nâng cao (như `ModelRegistry`, `PromptVersion`, `AIChatLog`, `GuardrailEvent`, `KnowledgeFreshness`, v.v.) chưa được thể hiện trên bất kỳ sơ đồ `.puml` nào.
2. **Về Sơ đồ Use Case**:
   * **UseCase-Trip**: Chưa vẽ các Use Case quản lý **Hành trình tự do (Custom Itinerary)** mà người dùng tự thiết kế qua router `itinerary` (như tạo hành trình, thêm ngày, thêm/sửa/xóa hoạt động).
   * **UseCase-AI**: Chưa tích hợp các Use Case liên quan đến **tầng hội thoại thông minh CIM** (Nhận diện cảm xúc, Loại trừ địa danh bị ghét, Trả lời trước hỏi sau, Xác thực Claim và lọc Guardrails).
   * **UseCase-Admin**: Thiếu toàn bộ các tương tác quản trị của AI Engineer/Admin đối với hệ thống kiểm toán AI (Quản lý Prompt, đăng ký Model, giám sát Drift tri thức, xử lý phản hồi Downvote).

---

## 2. CHI TIẾT KHOẢNG CÁCH & ĐỀ XUẤT CẢI TIẾN

### 2.1. ĐỐI CHIẾU SƠ ĐỒ ERD (DATABASE SCHEMA)

| STT | Thực thể trong Sơ đồ cũ | Thực tế trong `schema.prisma` | Đánh giá & Rủi ro | Giải pháp Điều chỉnh |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `PlaceCache`<br/>`FoodCache`<br/>`BlogCache` | **`SystemCache`** và **`CacheMetadata`** | **Lệch cấu trúc**: DB thực tế đã gộp 3 bảng này thành `SystemCache` với khóa composite `@@id([key, type])` để tiết kiệm tài nguyên. | Xóa bỏ 3 thực thể cũ trong sơ đồ `ERD_Cache.puml` và thay thế bằng `SystemCache` và `CacheMetadata`. |
| 2 | `Itinerary`<br/>`ItineraryDay`<br/>`ItineraryActivity` | **Gộp vào `Trip`, `TripDay`, `TripActivity`** | **Lệch nghiệp vụ**: CSDL không có 3 bảng này. Hệ thống dùng bảng `Trip` chính với `status: TripStatus` (`DRAFT_AI`, `DRAFT_USER`, `CONFIRMED`) để lưu trữ lịch trình nháp. | Xóa bỏ sơ đồ `ERD_Lich_Trinh_AI.puml`. Điều chỉnh các mô tả để làm rõ cơ chế Adapter ở tầng Repository chuyển đổi mô hình dữ liệu. |
| 3 | *Chưa có* | **10 Bảng Quản trị AI & Kiểm toán** | **Thiếu sót nghiêm trọng**: Thiếu thông tin thiết kế các thực thể quản trị quan trọng: `ModelRegistry`, `KnowledgeVersion`, `PromptVersion`, `AIChatLog`, `UserFeedback`, `EvaluationHistory`, `GuardrailEvent`, `KnowledgeFreshness`, `AuditTrail`. | **Tạo mới sơ đồ `ERD_AI_Governance.puml`** để mô tả trực quan cấu trúc kiểm toán AI. |

---

### 2.2. ĐỐI CHIẾU SƠ ĐỒ USE CASE

#### A. Sơ đồ `UseCase-Trip.puml` (Phân hệ Chuyến đi & Hành trình)
* **Khoảng cách**: Người dùng có chức năng tự thiết kế **Hành trình tự do (Custom Itinerary)** (CRUD ngày và hoạt động tự do hoàn toàn không phụ thuộc bản đồ). Đây là tính năng lớn của phân hệ `itinerary` nhưng chưa được thể hiện.
* **Đề xuất**: Thêm gói Use Cases:
  * `UC_TRIP_12`: Xem chi tiết hành trình tự do.
  * `UC_TRIP_13`: Tạo hành trình tự do mới.
  * `UC_TRIP_14`: Thêm ngày vào hành trình tự do.
  * `UC_TRIP_15`: Thêm hoạt động vào hành trình tự do.
  * `UC_TRIP_16`: Cập nhật hoạt động hành trình tự do.
  * `UC_TRIP_17`: Xóa hoạt động khỏi hành trình tự do.

#### B. Sơ đồ `UseCase-AI.puml` (Phân hệ Trợ lý ảo AI & RAG)
* **Khoảng cách**: Chỉ vẽ luồng RAG cơ bản. Thiếu các tính năng của **Tầng CIM (Conversation Intelligence)** và **Dual-Guardrails** mới xây dựng.
* **Đề xuất**: Bổ sung các Use Case:
  * `UC_AI_05`: Phân tích cảm xúc người dùng (Emotion Analyzer).
  * `UC_AI_06`: Áp dụng luật đè ý định (Rule Override Engine).
  * `UC_AI_07`: Ghi nhớ địa danh bị loại trừ (Context-based Exclusion).
  * `UC_AI_08`: Trả lời trước, hỏi sau (Answer First, Ask Later).
  * `UC_AI_09`: Xác thực mệnh đề nguyên tử (Claim Fact-Verification).

#### C. Sơ đồ `UseCase-Admin.puml` (Phân hệ Quản trị Hệ thống)
* **Khoảng cách**: Admin chỉ có quản lý bài đăng, người dùng, RAG cơ bản. Thiếu các Use Case liên quan đến **Kiểm toán chất lượng AI (AI Governance & Compliance)**.
* **Đề xuất**: Bổ sung các Use Case:
  * `UC_ADMIN_04`: Đăng ký & Kích hoạt phiên bản Model (Model Registry).
  * `UC_ADMIN_05`: Quản lý & So sánh Prompt (Prompt Versioning).
  * `UC_ADMIN_06`: Giám sát độ lệch tri thức (Knowledge Drift Monitoring).
  * `UC_ADMIN_07`: Kiểm toán nhật ký & Chi phí AI (AIChatLog & Cost Analytics).
  * `UC_ADMIN_08`: Duyệt câu sửa từ Feedback người dùng (Human-in-the-loop).

---

## 3. MÃ NGUỒN CẬP NHẬT CÁC SƠ ĐỒ PLANTUML (PROPOSED CODES)

### 3.1. Tạo mới sơ đồ Quản trị AI (`docs/uml/ERD/ERD_AI_Governance.puml`)
Sơ đồ mô tả cấu trúc 10 thực thể Quản trị AI liên kết chặt chẽ với tin nhắn chatbot:

```plantuml
@startuml ERD_AI_Governance

left to right direction
skinparam linetype ortho
skinparam ranksep 100
skinparam nodesep 80
hide circle
hide methods
hide stereotype

package "Phân hệ Quản trị & Kiểm toán AI" {
  entity "Đăng ký mô hình" as ModelRegistry {
    * id : String <<PK>>
    --
    * name : String <<UNIQUE>>
    * provider : String
    * type : String
    * version : String
    * isActive : Boolean
  }

  entity "Phiên bản Prompt" as PromptVersion {
    * id : String <<PK>>
    --
    * templateName : String
    * versionHash : String <<UNIQUE>>
    * templateText : String
    * isActive : Boolean
  }

  entity "Nhật ký AI Chat" as AIChatLog {
    * id : String <<PK>>
    --
    * messageId : String <<FK>> <<UNIQUE>>
    * modelId : String <<FK>>
    * promptId : String <<FK>>
    * query : String
    * llmPrompt : String
    * llmResponse : String
    * similarityScore : Float
    * confidenceScore : Int
    * reliabilityLevel : String
    * groundednessScore : Int
    * claimVerScore : Int
    * retrievedContext : String
    * promptTokens : Int
    * completionTokens : Int
    * totalTokens : Int
    * apiCostUsd : Float
    * latencyMs : Int
  }

  entity "Phản hồi học tập" as UserFeedback {
    * id : String <<PK>>
    --
    * chatLogId : String <<FK>>
    * rating : Int
    comment : String
    correctedText : String
    * isProcessed : Boolean
  }

  entity "Lịch sử đánh giá" as EvaluationHistory {
    * id : String <<PK>>
    --
    * chatLogId : String <<FK>>
    * metricName : String
    * score : Float
    * evaluatorModel : String
    reasoning : String
  }

  entity "Sự kiện Guardrail" as GuardrailEvent {
    * id : String <<PK>>
    --
    chatLogId : String <<FK>>
    * ruleViolated : String
    * severity : String
    * payloadBlocked : String
    * actionTaken : String
  }

  entity "Phiên bản Tri thức" as KnowledgeVersion {
    * id : String <<PK>>
    --
    * versionNumber : Int <<UNIQUE>>
    commitMessage : String
  }

  entity "Độ tươi mới Tri thức" as KnowledgeFreshness {
    * id : String <<PK>>
    --
    * contentId : String
    * versionId : Int <<FK>>
    * knowledgeCat : String
    * lastCheckedAt : DateTime
    * driftDetected : Boolean
  }

  entity "Vết kiểm toán hệ thống" as AuditTrail {
    * id : String <<PK>>
    --
    * actionType : String
    * actorName : String
    * description : String
    ipAddress : String
  }
}

entity "Tin nhắn AI" as ChatMessage <<External>>

ChatMessage ||--|| AIChatLog : "ghi nhật ký"
ModelRegistry ||--o{ AIChatLog : "chạy bằng"
PromptVersion ||--o{ AIChatLog : "sử dụng"
AIChatLog ||--o{ UserFeedback : "có phản hồi"
AIChatLog ||--o{ EvaluationHistory : "được đánh giá"
AIChatLog ||--o{ GuardrailEvent : "kích hoạt"
KnowledgeVersion ||--o{ KnowledgeFreshness : "được đánh dấu ở"

@enduml
```

### 3.2. Cập nhật sơ đồ Use Case Chuyến đi (`docs/uml/usecase/UseCase-Trip.puml`)
Tích hợp thêm 6 Use Case về **Hành trình tự do (Custom Itinerary)**:

```plantuml
@startuml UseCase_Trip
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome
skinparam linetype ortho

actor "Khách vãng lai" as Guest
actor "Khách du lịch" as Tourist
actor "Người dùng đăng ký" as RegisteredUser

Tourist -|> Guest
RegisteredUser -|> Tourist

rectangle "Phân hệ Lập kế hoạch & Hành trình" {
  usecase "Tìm kiếm điểm đến" as UC_SearchDest
  usecase "Tìm kiếm món ăn ẩm thực" as UC_SearchFood
  usecase "Xem thông tin chi tiết địa danh" as UC_ViewDetail
  
  usecase "Tạo chuyến đi mới" as UC_CreateTrip
  usecase "Chỉnh sửa chuyến đi" as UC_EditTrip
  usecase "Xóa chuyến đi" as UC_DeleteTrip
  usecase "Tự động tạo lịch trình bằng AI" as UC_AITrip
  usecase "Tối ưu hóa thứ tự lộ trình (TSP)" as UC_OptimizeRoute
  usecase "Lưu địa điểm yêu thích" as UC_SaveFavorite
  
  ' Bổ sung gói hành trình tự do (Custom Itineraries)
  package "Hành trình tự do" {
    usecase "Tạo hành trình tự do mới" as UC_CreateItin
    usecase "Xem danh sách hành trình tự do" as UC_ListItin
    usecase "Xem chi tiết hành trình tự do" as UC_ViewItin
    usecase "Thêm ngày vào hành trình tự do" as UC_AddDayItin
    usecase "Quản lý hoạt động hành trình tự do\n(Thêm/Sửa/Xóa)" as UC_ManageActItin
  }
}

Guest --> UC_SearchDest
Guest --> UC_SearchFood
Guest --> UC_ViewDetail

Tourist --> UC_CreateTrip
Tourist --> UC_EditTrip
Tourist --> UC_DeleteTrip

RegisteredUser --> UC_SaveFavorite
RegisteredUser --> UC_AITrip
RegisteredUser --> UC_CreateItin
RegisteredUser --> UC_ListItin
RegisteredUser --> UC_ViewItin

UC_ViewItin <.. UC_AddDayItin : <<extend>>
UC_ViewItin <.. UC_ManageActItin : <<extend>>
UC_CreateTrip <.. UC_AITrip : <<extend>>
UC_EditTrip ..> UC_OptimizeRoute : <<extend>>
@enduml
```

### 3.3. Cập nhật sơ đồ Use Case Quản trị AI (`docs/uml/usecase/UseCase-Admin.puml`)
Tích hợp phân hệ quản trị AI Governance & Audit Trail dành cho Admin:

```plantuml
@startuml UseCase_Admin
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome
skinparam linetype ortho

actor "Quản trị viên" as Admin

rectangle "Phân hệ Quản trị Hệ thống" {
  package "Quản trị Người dùng & Điểm đến" {
    usecase "Quản lý tài khoản người dùng" as UC_ManageUsers
    usecase "Quản lý điểm đến & ẩm thực" as UC_ManageDests
  }
  
  package "Quản trị Tri thức AI RAG" {
    usecase "Quản lý kho tri thức RAG" as UC_ManageKB
    usecase "Nạp tài liệu tri thức (Upload)" as UC_UploadDocs
  }

  ' Bổ sung gói Quản trị & Kiểm toán AI (AI Governance)
  package "Quản trị & Kiểm toán AI (Enterprise)" {
    usecase "Quản lý Đăng ký mô hình\n(Model Registry)" as UC_ModelRegistry
    usecase "Quản lý Phiên bản Prompt\n(Prompt Versioning)" as UC_PromptVersion
    usecase "Giám sát nhật ký & chi phí AI\n(Audit Chat Log & Cost)" as UC_AuditChatLog
    usecase "Giám sát độ lệch tri thức\n(Knowledge Drift Monitoring)" as UC_DriftMonitor
    usecase "Xử lý phản hồi tiêu cực\n(Human-in-the-loop)" as UC_FeedbackLoop
  }
}

Admin --> UC_ManageUsers
Admin --> UC_ManageDests
Admin --> UC_ManageKB
Admin --> UC_ModelRegistry
Admin --> UC_PromptVersion
Admin --> UC_AuditChatLog
Admin --> UC_DriftMonitor
Admin --> UC_FeedbackLoop

UC_ManageKB ..> UC_UploadDocs : <<include>>
@enduml
```

### 3.4. Cập nhật sơ đồ Use Case Trợ lý ảo RAG (`docs/uml/usecase/UseCase-AI.puml`)
Tích hợp các tương tác thông minh mới của Conversation Intelligence Module (CIM) và kiểm toán:

```plantuml
@startuml UseCase_AI
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome
skinparam linetype ortho

actor "Người dùng đăng ký" as RegisteredUser
actor "LLM Service" as LLM <<System>>

rectangle "Phân hệ Trợ lý ảo AI & RAG (CIM-enhanced)" {
  usecase "Khởi tạo cuộc hội thoại mới" as UC_StartConv
  usecase "Xem lịch sử trò chuyện" as UC_ConvHistory
  usecase "Đặt câu hỏi du lịch" as UC_AskQuestion
  usecase "Nhận câu trả lời từ AI" as UC_ReceiveAnswer
  
  ' Bổ sung các tính năng của CIM và bảo vệ
  usecase "Phân tích trạng thái cảm xúc" as UC_EmotionAnalysis
  usecase "Tự động áp dụng luật đè ý định" as UC_RuleOverride
  usecase "Áp dụng chính sách trì hoãn hỏi slot" as UC_AnswerFirst
  usecase "Sàng lọc Guardrails chống tấn công" as UC_Guardrails
  usecase "Xác thực Claim (Fact-checking)" as UC_FactCheck
  
  usecase "Gửi đánh giá câu trả lời AI" as UC_FeedbackResponse
}

RegisteredUser --> UC_StartConv
RegisteredUser --> UC_ConvHistory
RegisteredUser --> UC_AskQuestion
RegisteredUser --> UC_ReceiveAnswer
RegisteredUser --> UC_FeedbackResponse

UC_AskQuestion ..> UC_Guardrails : <<include>>
UC_ReceiveAnswer ..> UC_EmotionAnalysis : <<include>>
UC_ReceiveAnswer ..> UC_RuleOverride : <<include>>
UC_ReceiveAnswer ..> UC_AnswerFirst : <<include>>
UC_ReceiveAnswer ..> UC_FactCheck : <<include>>

UC_ReceiveAnswer --> LLM
@enduml
```
