import { OpenAI } from 'openai';

export function createOpenAIClient(apiKey: string): OpenAI {
  const baseURL = process.env.OPENAI_API_BASE_URL;
  
  // Nếu là Google Gemini API, tự động gắn key vào URL query parameter
  // và bổ sung header đặc thù của Google để tránh lỗi xác thực 400/401/404.
  const isGoogle = baseURL && baseURL.includes('googleapis.com');

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
    defaultHeaders: isGoogle
      ? { 'x-goog-api-key': apiKey }
      : undefined,
    defaultQuery: isGoogle
      ? { key: apiKey }
      : undefined,
  });
}
