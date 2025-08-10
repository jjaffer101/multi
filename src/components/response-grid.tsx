"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, DollarSign, AlertCircle } from "lucide-react";
import { PROVIDERS } from "@/lib/providers";

interface Response {
  id: string;
  provider: string;
  model: string;
  content: string;
  tokenCount?: number;
  duration?: number;
  cost?: number;
  error?: string;
}

interface ResponseGridProps {
  responses: Response[];
}

export default function ResponseGrid({ responses }: ResponseGridProps) {
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
      {responses.map(response => (
        <Card key={response.id} className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {getProviderName(response.provider)}
              </CardTitle>
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
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {response.content}
                  </div>
                </div>

                {/* Metrics */}
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
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
