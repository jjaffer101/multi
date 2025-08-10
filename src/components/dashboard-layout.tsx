"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Moon,
  Sun,
  Settings,
  MessageCircle,
  Send,
  User,
  LogOut,
  GitCompare,
  Grid,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import ConversationSidebar from "@/components/conversation-sidebar";
import ResponseGrid from "@/components/response-grid";
import StreamingResponseGrid from "@/components/streaming-response-grid";
import DiffViewer from "@/components/diff-viewer";
import { PROVIDERS } from "@/lib/providers";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  queries: { prompt: string; createdAt: string }[];
  _count: { queries: number };
}

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

interface QueryData {
  prompt: string;
  conversationId?: string | null;
  conversationTitle?: string;
}

export default function DashboardLayout() {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [streamingQuery, setStreamingQuery] = useState<QueryData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "diff">("grid");
  const { theme, setTheme } = useTheme();

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setResponses([]);

    // Use streaming by default
    const queryData = {
      prompt,
      conversationId: selectedConversation,
      conversationTitle: selectedConversation
        ? undefined
        : prompt.slice(0, 50) + "...",
    };

    setStreamingQuery(queryData);
    setPrompt("");
  };

  const handleStreamingComplete = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    setIsSubmitting(false);
    setStreamingQuery(null);
    await loadConversations();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        onDeleteConversation={loadConversations}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Multi AI</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            <div className="flex items-center gap-2 ml-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">{session?.user?.name}</span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full">
          {/* Query Input */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="Enter your query to compare responses from different AI models..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isSubmitting}
                />

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Query will be sent to:{" "}
                    {PROVIDERS.map(p => p.name).join(", ")}
                  </div>

                  <Button
                    type="submit"
                    disabled={!prompt.trim() || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* View Mode Toggle */}
          {(responses.length > 0 || streamingQuery) && (
            <div className="flex justify-center mb-4">
              <div className="flex border border-border rounded-lg p-1 bg-muted/20">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="flex items-center gap-2"
                >
                  <Grid className="h-4 w-4" />
                  Grid View
                </Button>
                <Button
                  variant={viewMode === "diff" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("diff")}
                  className="flex items-center gap-2"
                  disabled={responses.filter(r => !r.error).length < 2}
                >
                  <GitCompare className="h-4 w-4" />
                  Compare View
                </Button>
              </div>
            </div>
          )}

          {/* Streaming Responses */}
          {streamingQuery && (
            <StreamingResponseGrid
              queryData={streamingQuery}
              onComplete={handleStreamingComplete}
            />
          )}

          {/* Static Responses */}
          {responses.length > 0 && !streamingQuery && (
            <>
              {viewMode === "grid" ? (
                <ResponseGrid responses={responses} />
              ) : (
                <DiffViewer responses={responses} />
              )}
            </>
          )}

          {/* Empty State */}
          {responses.length === 0 && !isSubmitting && !streamingQuery && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Start a conversation
                </h3>
                <p className="text-muted-foreground">
                  Enter a query above to compare responses from multiple AI
                  models
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
