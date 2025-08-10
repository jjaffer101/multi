"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, MessageCircle, Trash2, Edit2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  queries: { prompt: string; createdAt: string }[];
  _count: { queries: number };
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string | null) => void;
  onDeleteConversation: () => void;
  open: boolean;
  onToggle: () => void;
}

export default function ConversationSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  onDeleteConversation,
  open,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleNewConversation = () => {
    onSelectConversation(null);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (selectedConversation === id) {
          onSelectConversation(null);
        }
        onDeleteConversation();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleEditConversation = (
    conversation: Conversation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editTitle }),
      });

      if (response.ok) {
        setEditingId(null);
        onDeleteConversation(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update conversation:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="w-80 border-r border-border bg-card/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={handleNewConversation}
          className="w-full flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conversation => (
              <Card
                key={conversation.id}
                className={cn(
                  "p-3 cursor-pointer transition-colors hover:bg-accent/50 group",
                  selectedConversation === conversation.id && "bg-accent"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="space-y-2">
                  {editingId === conversation.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full text-sm font-medium bg-background border border-border rounded px-2 py-1"
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            handleSaveEdit(conversation.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation();
                            handleSaveEdit(conversation.id);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation();
                            handleCancelEdit();
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-medium line-clamp-2 flex-1">
                          {conversation.title}
                        </h3>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e =>
                              handleEditConversation(conversation, e)
                            }
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e =>
                              handleDeleteConversation(conversation.id, e)
                            }
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{conversation._count.queries} queries</span>
                        <span>{formatDate(conversation.createdAt)}</span>
                      </div>

                      {conversation.queries[0] && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {conversation.queries[0].prompt}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
