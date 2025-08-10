import Anthropic from "@anthropic-ai/sdk";
import {
  ProviderAdapter,
  GenerateRequest,
  GenerateResponse,
  StreamChunk,
  PRICING,
} from "./types";

export class AnthropicProvider implements ProviderAdapter {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: request.model || "claude-3-5-sonnet-20241022",
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.prompt }],
      });

      const duration = Date.now() - startTime;
      const content =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      const tokenCount =
        response.usage?.input_tokens + response.usage?.output_tokens;

      // Calculate cost
      const model = request.model || "claude-3-5-sonnet-20241022";
      const pricing = PRICING[model];
      const cost =
        pricing && response.usage
          ? (response.usage.input_tokens * pricing.input +
              response.usage.output_tokens * pricing.output) /
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
      const stream = await this.client.messages.create({
        model: request.model || "claude-3-5-sonnet-20241022",
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.prompt }],
        stream: true,
      });

      let fullContent = "";

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const content = chunk.delta.text;
          fullContent += content;

          yield {
            content,
            done: false,
          };
        }
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
