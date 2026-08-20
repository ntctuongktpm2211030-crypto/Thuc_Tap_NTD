declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};
declare const fetch: any;

export interface OpenAIClient {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: { role: string; content: string }[];
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: string };
      }) => Promise<any>;
    };
  };
}

export function createOpenAIClient(apiKey: string): OpenAIClient {
  const baseURL = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/';

  return {
    chat: {
      completions: {
        create: async (params) => {
          const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify(params),
          });

          if (!res.ok) {
            const errText = await res.text();
            const err: any = new Error(`API error (${res.status}): ${errText}`);
            err.status = res.status;
            throw err;
          }

          return await res.json();
        },
      },
    },
  };
}
