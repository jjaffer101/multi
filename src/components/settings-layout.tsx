"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Moon,
  Sun,
  User,
  Key,
  Settings as SettingsIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { PROVIDERS } from "@/lib/providers";

interface ModelSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export default function SettingsLayout() {
  const [activeTab, setActiveTab] = useState("models");
  const [modelSettings, setModelSettings] = useState<
    Record<string, ModelSettings>
  >(() => {
    const settings: Record<string, ModelSettings> = {};
    PROVIDERS.forEach(provider => {
      settings[provider.id] = {
        model: provider.defaultModel,
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: "",
      };
    });
    return settings;
  });

  const { theme, setTheme } = useTheme();
  const { data: session } = authClient.useSession();

  const handleSaveSettings = () => {
    // Save to localStorage for now
    localStorage.setItem("multiAiSettings", JSON.stringify(modelSettings));
    // Show success message
    alert("Settings saved successfully!");
  };

  const handleModelSettingChange = (
    provider: string,
    key: keyof ModelSettings,
    value: string | number
  ) => {
    setModelSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [key]: value,
      },
    }));
  };

  const tabs = [
    { id: "models", label: "Model Settings", icon: SettingsIcon },
    { id: "api", label: "API Keys", icon: Key },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 space-y-2">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {activeTab === "models" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Model Configuration
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Configure default settings for each AI provider
                  </p>
                </div>

                {PROVIDERS.map(provider => (
                  <Card key={provider.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Model
                          </label>
                          <select
                            value={
                              modelSettings[provider.id]?.model ||
                              provider.defaultModel
                            }
                            onChange={e =>
                              handleModelSettingChange(
                                provider.id,
                                "model",
                                e.target.value
                              )
                            }
                            className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
                          >
                            {provider.models.map(model => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Temperature
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="2"
                            step="0.1"
                            value={
                              modelSettings[provider.id]?.temperature || 0.7
                            }
                            onChange={e =>
                              handleModelSettingChange(
                                provider.id,
                                "temperature",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Max Tokens
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max="8000"
                            value={
                              modelSettings[provider.id]?.maxTokens || 2000
                            }
                            onChange={e =>
                              handleModelSettingChange(
                                provider.id,
                                "maxTokens",
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          System Prompt (Optional)
                        </label>
                        <Textarea
                          placeholder="Custom system prompt for this provider..."
                          value={modelSettings[provider.id]?.systemPrompt || ""}
                          onChange={e =>
                            handleModelSettingChange(
                              provider.id,
                              "systemPrompt",
                              e.target.value
                            )
                          }
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    API Configuration
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    API keys are configured via environment variables for
                    security
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Add these environment variables to your deployment:
                    </p>

                    <div className="space-y-3 font-mono text-sm bg-muted p-4 rounded-lg">
                      <div>OPENAI_API_KEY=your_openai_key</div>
                      <div>ANTHROPIC_API_KEY=your_anthropic_key</div>
                      <div>PERPLEXITY_API_KEY=your_perplexity_key</div>
                      <div>GEMINI_API_KEY=your_gemini_key</div>
                      <div className="text-muted-foreground">
                        # Optional for Google OAuth:
                      </div>
                      <div>GOOGLE_CLIENT_ID=your_google_client_id</div>
                      <div>GOOGLE_CLIENT_SECRET=your_google_client_secret</div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Security Notice
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        API keys are never stored in the database or exposed to
                        the client. They are only used server-side to make API
                        calls to the respective providers.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Profile Settings
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Manage your account and preferences
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Name
                      </label>
                      <Input value={session?.user?.name || ""} disabled />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Email
                      </label>
                      <Input value={session?.user?.email || ""} disabled />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Theme</label>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred theme
                        </p>
                      </div>
                      <div className="flex border border-border rounded-lg p-1">
                        <Button
                          variant={theme === "light" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setTheme("light")}
                          className="flex items-center gap-2"
                        >
                          <Sun className="h-4 w-4" />
                          Light
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setTheme("dark")}
                          className="flex items-center gap-2"
                        >
                          <Moon className="h-4 w-4" />
                          Dark
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setTheme("system")}
                        >
                          System
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
