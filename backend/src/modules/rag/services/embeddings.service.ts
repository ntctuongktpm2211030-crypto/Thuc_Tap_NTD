export class EmbeddingsService {
  private apiKey: string | null = null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'your_gemini_key_here') {
      this.apiKey = key;
    }
  }

  /**
   * Sinh vector embedding cho văn bản bằng Gemini Embedding API hoặc Local Engine
   */
  async generate(text: string): Promise<number[]> {
    if (this.apiKey) {
      try {
        const EMBEDDING_TIMEOUT_MS = parseInt(process.env.EMBEDDING_TIMEOUT_MS || '15000', 10);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
              parts: [{ text: text }],
            },
          }),
          signal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          if (data && data.embedding && Array.isArray(data.embedding.values)) {
            return data.embedding.values;
          }
        }
        console.warn(`[EmbeddingsService] Gemini Embedding API trả về status ${response.status}. Chuyển sang Local Engine.`);
      } catch (err) {
        console.warn('[EmbeddingsService] Lỗi gọi Gemini Embeddings API, chuyển sang Local Hashing Engine.', err);
      }
    }

    // Fallback sang Local Hashing Engine (128 chiều, L2 Normalized)
    return this.generateLocal(text);
  }

  /**
   * Local Hashing & Token Frequency Embedding Engine
   * Sinh ra vector 128 chiều chuẩn hóa L2 (L2 normalized) giúp tính toán Cosine Similarity hiệu quả
   */
  private generateLocal(text: string): number[] {
    const dimensions = 128;
    const vector = new Array(dimensions).fill(0);
    // Tách từ đơn giản và loại bỏ ký tự đặc biệt
    const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    const tokens = cleanText.split(/\s+/).filter((t) => t.length > 0);

    if (tokens.length === 0) {
      vector[0] = 1.0;
      return vector;
    }

    tokens.forEach((token) => {
      // Thuật toán băm chuỗi DJB2 đơn giản để map từ khóa vào index
      let hash = 5381;
      for (let i = 0; i < token.length; i++) {
        hash = (hash * 33) ^ token.charCodeAt(i);
      }
      const index = Math.abs(hash) % dimensions;
      // Trọng số tăng dần theo tần suất xuất hiện
      vector[index] += 1;
    });

    // Chuẩn hóa L2 Normalize vector về độ dài bằng 1
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] /= magnitude;
      }
    } else {
      vector[0] = 1.0;
    }

    return vector;
  }
}
