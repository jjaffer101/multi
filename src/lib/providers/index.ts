import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { PerplexityProvider } from "./perplexity";
import { GeminiProvider } from "./gemini";
import { ProviderAdapter } from "./types";

export const providers: Record<string, ProviderAdapter> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  perplexity: new PerplexityProvider(),
  gemini: new GeminiProvider(),
};

export * from "./types";
