import { createOpenAIClient } from '../generate/client';

export async function generateEmbedding(text: string, localOnly = false): Promise<number[]> {
  if (localOnly) {
    return generateLocalEmbedding(text);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_API_BASE_URL;

  // Nếu sử dụng Google Gemini hoặc Groq (không hỗ trợ endpoint embedding tương thích),
  // ta bỏ qua để chạy thẳng Local Fallback nhằm tránh gọi mạng gây chậm/lỗi.
  const isGoogle = baseURL && baseURL.includes('googleapis.com');
  const isGroq = baseURL && baseURL.includes('groq.com');

  if (apiKey && !isGoogle && !isGroq) {
    try {
      const openai = createOpenAIClient(apiKey);
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      console.warn('[Embedding] OpenAI embedding failed, using local fallback.');
    }
  }

  return generateLocalEmbedding(text);
}

function generateLocalEmbedding(text: string): number[] {
  const dimensions = 128;
  const vector = new Array(dimensions).fill(0);

  const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  const tokens = cleanText.split(/\s+/).filter(t => t.length > 0);

  if (tokens.length === 0) {
    vector[0] = 1.0;
    return vector;
  }

  for (const token of tokens) {
    let hash = 5381;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 33) ^ token.charCodeAt(i);
    }
    const index = Math.abs(hash) % dimensions;
    vector[index] += 1.0;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map(val => val / magnitude);
  } else {
    vector[0] = 1.0;
    return vector;
  }
}
