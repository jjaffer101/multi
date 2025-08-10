import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ProviderAdapter,
  GenerateRequest,
  GenerateResponse,
  StreamChunk,
  PRICING,
} from "./types";

export class GeminiProvider implements ProviderAdapter {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      const model = this.client.getGenerativeModel({
        model: request.model || "gemini-1.5-pro",
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2000,
        },
        systemInstruction: request.systemPrompt,
      });

      const result = await model.generateContent(request.prompt);
      const response = await result.response;

      const duration = Date.now() - startTime;
      const content = response.text();
      const tokenCount = response.usageMetadata?.totalTokenCount;

      // Calculate cost
      const modelName = request.model || "gemini-1.5-pro";
      const pricing = PRICING[modelName];
      const cost =
        pricing && response.usageMetadata
          ? (response.usageMetadata.promptTokenCount * pricing.input +
              response.usageMetadata.candidatesTokenCount * pricing.output) /
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
      const model = this.client.getGenerativeModel({
        model: request.model || "gemini-1.5-pro",
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2000,
        },
        systemInstruction: request.systemPrompt,
      });

      const result = await model.generateContentStream(request.prompt);

      for await (const chunk of result.stream) {
        const content = chunk.text();

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
