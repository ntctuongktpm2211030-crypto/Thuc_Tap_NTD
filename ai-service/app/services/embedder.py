import re
import math
from typing import List
from openai import OpenAI
from ..config import settings

class EmbedderService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY if settings.OPENAI_API_KEY else None
        self.base_url = settings.OPENAI_API_BASE_URL if settings.OPENAI_API_BASE_URL else None
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url if self.base_url else None
        ) if self.api_key else None

    def generate(self, text: str) -> List[float]:
        """
        Sinh vector embedding cho văn bản. 
        Ưu tiên gọi OpenAI API (1536 chiều), fallback sang Local Hashing Engine (128 chiều).
        """
        if self.client:
            try:
                response = self.client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"[EmbedderService] Lỗi gọi OpenAI, chuyển sang Local Engine: {e}")
        
        return self._generate_local(text)

    def _generate_local(self, text: str) -> List[float]:
        """
        Local Hashing Engine sinh ra vector 128 chiều chuẩn hóa L2 (tương thích ngược hoàn toàn với Backend)
        """
        dimensions = 128
        vector = [0.0] * dimensions
        
        # Làm sạch ký tự và chuyển chữ thường
        clean_text = text.lower()
        clean_text = re.sub(r'[.,\/#!$%\^&\*;:{}=\-_`~()]', '', clean_text)
        tokens = [t for t in clean_text.split() if len(t) > 0]

        if not tokens:
            vector[0] = 1.0
            return vector

        # Băm DJB2 để map token vào index
        for token in tokens:
            hash_val = 5381
            for char in token:
                hash_val = (hash_val * 33) ^ ord(char)
            index = abs(hash_val) % dimensions
            vector[index] += 1.0

        # Chuẩn hóa L2 Normalize
        magnitude = math.sqrt(sum(val * val for val in vector))
        if magnitude > 0:
            vector = [val / magnitude for val in vector]
        else:
            vector[0] = 1.0

        return vector
