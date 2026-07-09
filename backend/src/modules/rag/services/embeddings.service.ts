export class EmbeddingsService {
  private apiKey: string | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.apiKey = process.env.OPENAI_API_KEY;
    }
  }

  /**
   * Sinh vector embedding cho văn bản
   */
  async generate(text: string): Promise<number[]> {
    const isGroq = this.apiKey && (this.apiKey.startsWith('gsk_') || process.env.OPENAI_API_BASE_URL?.includes('groq.com'));
    const isGoogle = this.apiKey && (this.apiKey.startsWith('AIzaSy') || process.env.OPENAI_API_BASE_URL?.includes('googleapis.com'));

    if (this.apiKey && !isGroq && !isGoogle) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          if (data && data.data && data.data[0] && data.data[0].embedding) {
            return data.data[0].embedding;
          }
        }
        console.warn(`[EmbeddingsService] OpenAI API trả về status: ${response.status}. Chuyển sang Local Engine.`);
      } catch (err) {
        console.warn('[EmbeddingsService] Lỗi gọi OpenAI Embeddings API, tự động chuyển sang Local Hashing Engine.', err);
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
