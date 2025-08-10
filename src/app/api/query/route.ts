import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { providers, PROVIDERS } from "@/lib/providers";

interface QueryRequest {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: QueryRequest = await request.json();
    const {
      prompt,
      systemPrompt,
      conversationId,
      conversationTitle,
      models = {},
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
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

    // Run queries in parallel for all providers
    const responses = await Promise.allSettled(
      PROVIDERS.map(async provider => {
        const startTime = Date.now();
        const providerConfig = models[provider.id] || {};

        try {
          const response = await providers[provider.id].generate({
            prompt,
            systemPrompt,
            model: providerConfig.model || provider.defaultModel,
            temperature: providerConfig.temperature,
            maxTokens: providerConfig.maxTokens,
          });

          // Save response to database
          return await db.response.create({
            data: {
              provider: provider.id,
              model: providerConfig.model || provider.defaultModel,
              content: response.content,
              tokenCount: response.tokenCount,
              duration: response.duration,
              cost: response.cost,
              error: response.error,
              queryId: query.id,
            },
          });
        } catch (error) {
          // Save error response
          return await db.response.create({
            data: {
              provider: provider.id,
              model: providerConfig.model || provider.defaultModel,
              content: "",
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : "Unknown error",
              queryId: query.id,
            },
          });
        }
      })
    );

    // Get all responses (both successful and failed)
    const allResponses = responses.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        // This shouldn't happen since we handle errors above, but just in case
        return {
          provider: PROVIDERS[index].id,
          model: PROVIDERS[index].defaultModel,
          content: "",
          error: "Failed to create response record",
        };
      }
    });

    return NextResponse.json({
      queryId: query.id,
      conversationId: conversation.id,
      responses: allResponses,
    });
  } catch (error) {
    console.error("Query API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
