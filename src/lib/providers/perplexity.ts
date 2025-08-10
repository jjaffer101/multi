import OpenAI from "openai";
import {
  ProviderAdapter,
  GenerateRequest,
  GenerateResponse,
  StreamChunk,
  PRICING,
} from "./types";

export class PerplexityProvider implements ProviderAdapter {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: "https://api.perplexity.ai",
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: request.model || "llama-3.1-sonar-large-128k-online",
        messages: [
          ...(request.systemPrompt
            ? [{ role: "system" as const, content: request.systemPrompt }]
            : []),
          { role: "user" as const, content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        stream: false,
      });

      const duration = Date.now() - startTime;
      const content = response.choices[0]?.message?.content || "";
      const tokenCount = response.usage?.total_tokens;

      // Calculate cost
      const model = request.model || "llama-3.1-sonar-large-128k-online";
      const pricing = PRICING[model];
      const cost =
        pricing && response.usage
          ? (response.usage.prompt_tokens * pricing.input +
              response.usage.completion_tokens * pricing.output) /
            1000
          : undefined;

      return {
        content,
        tokenCount,
        duration,
        cost,
      };
    } catch (error) {
      return {
        content: "",
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async *generateStream(request: GenerateRequest): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();

    try {
      const stream = await this.client.chat.completions.create({
        model: request.model || "llama-3.1-sonar-large-128k-online",
        messages: [
          ...(request.systemPrompt
            ? [{ role: "system" as const, content: request.systemPrompt }]
            : []),
          { role: "user" as const, content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        stream: true,
      });

      let fullContent = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullContent += content;

        yield {
          content,
          done: false,
        };
      }

      yield {
        content: "",
        done: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      yield {
        content: "",
        done: true,
        duration: Date.now() - startTime,
      };
    }
  }
}
