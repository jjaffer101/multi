export interface LLMProvider {
  id: string;
  name: string;
  models: string[];
  defaultModel: string;
}

export interface GenerateRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GenerateResponse {
  content: string;
  tokenCount?: number;
  duration: number;
  cost?: number;
  error?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  tokenCount?: number;
  duration?: number;
}

export interface ProviderAdapter {
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  generateStream(request: GenerateRequest): AsyncGenerator<StreamChunk>;
}

export const PROVIDERS: LLMProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    models: [
      "llama-3.1-sonar-large-128k-online",
      "llama-3.1-sonar-small-128k-online",
    ],
    defaultModel: "llama-3.1-sonar-large-128k-online",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"],
    defaultModel: "gemini-1.5-pro",
  },
];

// Pricing per 1K tokens (input/output)
export const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015 },
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
  "llama-3.1-sonar-large-128k-online": { input: 0.001, output: 0.001 },
  "llama-3.1-sonar-small-128k-online": { input: 0.0002, output: 0.0002 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
};
