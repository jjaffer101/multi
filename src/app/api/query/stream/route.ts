import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, PROVIDERS } from "@/lib/providers";

interface StreamQueryRequest {
  prompt: string;
  systemPrompt?: string;
  conversationId?: string;
  conversationTitle?: string;
  models?: Record<
    string,
    { model: string; temperature?: number; maxTokens?: number }
  >;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body: StreamQueryRequest = await request.json();
    const {
      prompt,
      systemPrompt,
      conversationId,
      conversationTitle,
      models = {},
    } = body;

    if (!prompt) {
      return new Response("Prompt is required", { status: 400 });
    }

    // Create or get conversation
    let conversation;
    if (conversationId) {
      conversation = await db.conversation.findFirst({
        where: {
          id: conversationId,
          userId: session.user.id,
        },
      });
      if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
      }
    } else {
      conversation = await db.conversation.create({
        data: {
          title: conversationTitle || prompt.slice(0, 50) + "...",
          userId: session.user.id,
        },
      });
    }

    // Create query record
    const query = await db.query.create({
      data: {
        prompt,
        systemPrompt,
        conversationId: conversation.id,
      },
    });

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start all provider streams
          const streams = PROVIDERS.map(provider => {
            const providerConfig = models[provider.id] || {};
            return {
              provider: provider.id,
              model: providerConfig.model || provider.defaultModel,
              stream: providers[provider.id].generateStream({
                prompt,
                systemPrompt,
                model: providerConfig.model || provider.defaultModel,
                temperature: providerConfig.temperature,
                maxTokens: providerConfig.maxTokens,
              }),
              content: "",
              done: false,
            };
          });

          // Send initial data
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "start",
                queryId: query.id,
                conversationId: conversation.id,
                providers: PROVIDERS.map(p => p.id),
              })}\n\n`
            )
          );

          // Process streams concurrently
          while (streams.some(s => !s.done)) {
            await Promise.all(
              streams.map(async streamData => {
                if (streamData.done) return;

                try {
                  const { value } = await streamData.stream.next();
                  if (value) {
                    if (value.done) {
                      streamData.done = true;
                      // Save final response to database
                      await db.response.create({
                        data: {
                          provider: streamData.provider,
                          model: streamData.model,
                          content: streamData.content,
                          tokenCount: value.tokenCount,
                          duration: value.duration,
                          queryId: query.id,
                        },
                      });

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "complete",
                            provider: streamData.provider,
                            tokenCount: value.tokenCount,
                            duration: value.duration,
                          })}\n\n`
                        )
                      );
                    } else {
                      streamData.content += value.content;
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            type: "chunk",
                            provider: streamData.provider,
                            content: value.content,
                          })}\n\n`
                        )
                      );
                    }
                  }
                } catch (error) {
                  streamData.done = true;
                  // Save error response
                  await db.response.create({
                    data: {
                      provider: streamData.provider,
                      model: streamData.model,
                      content: streamData.content,
                      error:
                        error instanceof Error
                          ? error.message
                          : "Unknown error",
                      queryId: query.id,
                    },
                  });

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: "error",
                        provider: streamData.provider,
                        error:
                          error instanceof Error
                            ? error.message
                            : "Unknown error",
                      })}\n\n`
                    )
                  );
                }
              })
            );

            // Small delay to prevent overwhelming the client
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "end" })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
