"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { PROVIDERS } from "@/lib/providers";

interface StreamingResponse {
  provider: string;
  model: string;
  content: string;
  loading: boolean;
  error?: string;
  tokenCount?: number;
  duration?: number;
  cost?: number;
}

interface StreamingResponseGridProps {
  queryData: {
    prompt: string;
    systemPrompt?: string;
    conversationId?: string | null;
    conversationTitle?: string;
    models?: Record<
      string,
      { model: string; temperature?: number; maxTokens?: number }
    >;
  };
  onComplete: (conversationId: string) => void;
}

export default function StreamingResponseGrid({
  queryData,
  onComplete,
}: StreamingResponseGridProps) {
  const [responses, setResponses] = useState<Record<string, StreamingResponse>>(
    {}
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    startStreaming();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startStreaming = async () => {
    setIsStreaming(true);

    // Initialize responses for each provider
    const initialResponses: Record<string, StreamingResponse> = {};
    PROVIDERS.forEach(provider => {
      const model =
        queryData.models?.[provider.id]?.model || provider.defaultModel;
      initialResponses[provider.id] = {
        provider: provider.id,
        model,
        content: "",
        loading: true,
      };
    });
    setResponses(initialResponses);

    try {
      const response = await fetch("/api/query/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryData),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "start") {
                onComplete(data.conversationId);
              } else if (data.type === "chunk") {
                setResponses(prev => ({
                  ...prev,
                  [data.provider]: {
                    ...prev[data.provider],
                    content: prev[data.provider].content + data.content,
                  },
                }));
              } else if (data.type === "complete") {
                setResponses(prev => ({
                  ...prev,
                  [data.provider]: {
                    ...prev[data.provider],
                    loading: false,
                    tokenCount: data.tokenCount,
                    duration: data.duration,
                  },
                }));
              } else if (data.type === "error") {
                setResponses(prev => ({
                  ...prev,
                  [data.provider]: {
                    ...prev[data.provider],
                    loading: false,
                    error: data.error,
                  },
                }));
              } else if (data.type === "end") {
                setIsStreaming(false);
              }
            } catch (err) {
              console.error("Failed to parse streaming data:", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setIsStreaming(false);
      // Mark all loading responses as errored
      setResponses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key].loading) {
            updated[key] = {
              ...updated[key],
              loading: false,
              error: "Connection failed",
            };
          }
        });
        return updated;
      });
    }
  };

  const getProviderName = (providerId: string) => {
    return PROVIDERS.find(p => p.id === providerId)?.name || providerId;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTokensPerSecond = (tokens: number, ms: number) => {
    const tokensPerSecond = (tokens / ms) * 1000;
    return tokensPerSecond.toFixed(1);
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {PROVIDERS.map(provider => {
        const response = responses[provider.id];
        if (!response) return null;

        return (
          <Card key={provider.id} className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">
                    {getProviderName(provider.id)}
                  </CardTitle>
                  {response.loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {response.model}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {response.error ? (
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{response.error}</p>
                </div>
              ) : (
                <>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed min-h-[3rem]">
                      {response.content}
                      {response.loading && (
                        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  {!response.loading && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
                      {response.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(response.duration)}</span>
                        </div>
                      )}

                      {response.tokenCount && response.duration && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>
                            {formatTokensPerSecond(
                              response.tokenCount,
                              response.duration
                            )}{" "}
                            tok/s
                          </span>
                        </div>
                      )}

                      {response.cost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCost(response.cost)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
