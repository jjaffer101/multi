"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { diffWords, Change } from "diff";
import { PROVIDERS } from "@/lib/providers";
import { GitCompare, Eye, EyeOff } from "lucide-react";

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

interface DiffViewerProps {
  responses: Response[];
}

export default function DiffViewer({ responses }: DiffViewerProps) {
  const [selectedBaseline, setSelectedBaseline] = useState<string>(
    responses[0]?.provider || ""
  );
  const [showDiff, setShowDiff] = useState(true);

  const getProviderName = (providerId: string) => {
    return PROVIDERS.find(p => p.id === providerId)?.name || providerId;
  };

  const validResponses = responses.filter(r => !r.error && r.content.trim());

  if (validResponses.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Response Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Need at least 2 successful responses to compare
          </p>
        </CardContent>
      </Card>
    );
  }

  const baselineResponse = validResponses.find(
    r => r.provider === selectedBaseline
  );
  if (!baselineResponse) {
    return null;
  }

  const renderDiffContent = (content: string, baseline: string) => {
    if (!showDiff) {
      return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </div>
      );
    }

    const changes = diffWords(baseline, content);

    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {changes.map((change: Change, index: number) => {
          if (change.added) {
            return (
              <span
                key={index}
                className="bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              >
                {change.value}
              </span>
            );
          } else if (change.removed) {
            return (
              <span
                key={index}
                className="bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through"
              >
                {change.value}
              </span>
            );
          } else {
            return <span key={index}>{change.value}</span>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Response Comparison
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedBaseline}
                onChange={e => setSelectedBaseline(e.target.value)}
                className="text-sm border border-input bg-background rounded-md px-2 py-1"
              >
                {validResponses.map(response => (
                  <option key={response.provider} value={response.provider}>
                    Baseline: {getProviderName(response.provider)}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDiff(!showDiff)}
                className="flex items-center gap-1"
              >
                {showDiff ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showDiff ? "Hide Diff" : "Show Diff"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {validResponses.map(response => {
          const isBaseline = response.provider === selectedBaseline;

          return (
            <Card
              key={response.provider}
              className={isBaseline ? "ring-2 ring-primary" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {getProviderName(response.provider)}
                    </CardTitle>
                    {isBaseline && (
                      <Badge variant="default" className="text-xs">
                        Baseline
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {response.model}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {isBaseline ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {response.content}
                    </div>
                  ) : (
                    renderDiffContent(
                      response.content,
                      baselineResponse.content
                    )
                  )}
                </div>

                {/* Metrics */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
                  {response.tokenCount && (
                    <span>{response.tokenCount} tokens</span>
                  )}
                  {response.duration && (
                    <span>
                      {response.duration < 1000
                        ? `${response.duration}ms`
                        : `${(response.duration / 1000).toFixed(1)}s`}
                    </span>
                  )}
                  {response.cost && <span>${response.cost.toFixed(4)}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showDiff && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">Diff Legend:</h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="bg-green-200 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                    Added text
                  </span>
                  <span className="text-xs">
                    Content added compared to baseline
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-200 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through px-2 py-1 rounded text-xs">
                    Removed text
                  </span>
                  <span className="text-xs">Content removed from baseline</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
