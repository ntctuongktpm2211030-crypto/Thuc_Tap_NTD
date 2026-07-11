import json
from openai import OpenAI
from typing import Dict, Any, List
from ..config import settings

class LlmGeneratorService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY if settings.OPENAI_API_KEY else None
        self.base_url = settings.OPENAI_API_BASE_URL if settings.OPENAI_API_BASE_URL else None
        self.client = OpenAI(
            api_key=self.api_key, 
            base_url=self.base_url if self.base_url else None
        ) if self.api_key else None

    def generate_q2q_q2a(self, raw_text: str, title_hint: str, category: str) -> Dict[str, Any]:
        """
        Phân tích văn bản thô để chuẩn hóa, chia nhỏ thành Content chính, nhiều câu hỏi mẫu (Q2Q) và nhiều đáp án mẫu (Q2A)
        """
        if self.client:
            try:
                prompt = f"""
Bạn là chuyên gia chuẩn hóa dữ liệu tri thức du lịch thông minh Việt Nam. Hãy phân tích đoạn văn bản thô dưới đây để trích xuất và sinh ra cấu trúc câu hỏi-đáp án (Q2Q & Q2A) định dạng JSON.

[Văn bản thô]
"{raw_text}"

[Thể loại gợi ý]
"{category}"

[Yêu cầu định dạng phản hồi]
Hãy trả về DUY NHẤT một chuỗi JSON có cấu trúc chính xác như sau, không được chèn thêm ký tự markdown hay bất kỳ lời giải thích nào khác ngoài JSON:
{{
  "title": "Tiêu đề ngắn gọn và đặc trưng nhất của nội dung (Ví dụ: Lễ hội hoa tam giác mạch Hà Giang)",
  "body": "Đoạn văn bản tóm tắt nội dung tri thức đã được chuẩn hóa, viết lại ngắn gọn, súc tích và mạch lạc.",
  "questions": [
    "Câu hỏi mẫu 1 xoay quanh nội dung?",
    "Câu hỏi mẫu 2 xoay quanh nội dung?",
    "Câu hỏi mẫu 3 xoay quanh nội dung?"
  ],
  "answers": [
    "Câu trả lời trực tiếp ngắn gọn 1",
    "Câu trả lời trực tiếp ngắn gọn 2"
  ]
}}
"""
                model_name = settings.OPENAI_MODEL_NAME if settings.OPENAI_MODEL_NAME else "gpt-4o-mini"
                response = self.client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=2000
                )
                result_text = response.choices[0].message.content.strip()
                
                # Làm sạch markdown wrappers nếu LLM tự động bọc bằng ```json
                if result_text.startswith("```json"):
                    result_text = result_text.replace("```json", "", 1)
                if result_text.endswith("```"):
                    result_text = result_text[:-3]
                
                return json.loads(result_text.strip())
            except Exception as e:
                print(f"[LlmGenerator] OpenAI generation failed, using local fallback: {e}")
                
        return self._generate_local_fallback(raw_text, title_hint, category)

    def _generate_local_fallback(self, raw_text: str, title_hint: str, category: str) -> Dict[str, Any]:
        """
        Bộ sinh fallback tự động bằng regex/string khi không cấu hình OpenAI Key
        """
        # Rút gọn văn bản thô
        body = raw_text.strip()
        
        # Sinh các câu hỏi mẫu
        questions = [
            f"Thông tin chi tiết về {title_hint} là gì?",
            f"Giới thiệu tổng quan về {title_hint}?",
            f"Tìm hiểu văn hóa du lịch liên quan đến {title_hint}?"
        ]
        
        # Sinh câu trả lời mẫu
        answers = [
            f"Dưới đây là thông tin chi tiết về {title_hint} thuộc phân loại {category}.",
            body[:200] + "..." if len(body) > 200 else body
        ]
        
        return {
            "title": title_hint,
            "body": body,
            "questions": questions,
            "answers": answers
        }
