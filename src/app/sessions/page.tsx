"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  Terminal,
  MessageSquare,
  Clock,
  Cpu,
  Hash,
  Calendar,
  Bot,
} from "lucide-react";
import { formatAge, formatTokens, parseSessionKey, getSessionIcon, getHumanSessionName, getSessionDescription } from "@/lib/types";
import type { SessionInfo, SessionsListResponse } from "@/lib/types";

export default function SessionsPage() {
  const [data, setData] = useState<SessionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionInfo | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const sessionsData = await res.json();
      setData(sessionsData);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, []);

  const sessions = data?.sessions ?? [];

  // Group sessions by type
  const groupedSessions = sessions.reduce((acc, session) => {
    const { type } = parseSessionKey(session.key);
    if (!acc[type]) acc[type] = [];
    acc[type].push(session);
    return acc;
  }, {} as Record<string, SessionInfo[]>);

  const typeLabels: Record<string, string> = {
    main: "Main Sessions",
    discord: "Discord",
    whatsapp: "WhatsApp",
    cron: "Cron Jobs",
    subagent: "Sub-agents",
  };

  if (loading && !data) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-hex-glow">Sessions</h1>
            <p className="text-muted-foreground">Each session is a separate conversation context — like different chat windows. Discord channels, cron jobs, and sub-agents each get their own session.</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary text-hex-glow">Sessions</h1>
          <p className="text-muted-foreground">
            {data?.count ?? 0} active sessions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessions}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Session List */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedSessions).map(([type, typeSessions]) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getSessionIcon(type)}</span>
                  <CardTitle className="text-lg">
                    {typeLabels[type] ?? type}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    {typeSessions.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {typeSessions.map((session) => {
                      const isSelected = selectedSession?.sessionId === session.sessionId;
                      const humanName = getHumanSessionName(session.key);
                      const description = getSessionDescription(session);
                      
                      return (
                        <div
                          key={session.sessionId}
                          onClick={() => setSelectedSession(session)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary/10 border-primary"
                              : "bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate text-foreground">
                                {humanName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatAge(session.ageMs ?? session.age ?? 0)}
                                </span>
                                {session.model && (
                                  <span className="flex items-center gap-1">
                                    <Cpu className="h-3 w-3" />
                                    {session.model.replace("claude-", "")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {session.totalTokens !== undefined && (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {formatTokens(session.totalTokens)}
                                </Badge>
                              )}
                              {session.percentUsed !== undefined && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {session.percentUsed}%
                                  </span>
                                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        session.percentUsed > 80
                                          ? "bg-destructive"
                                          : session.percentUsed > 50
                                          ? "bg-primary"
                                          : "bg-green-500"
                                      }`}
                                      style={{ width: `${session.percentUsed}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Session Details */}
        <Card className="lg:col-span-1 h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Session Details</CardTitle>
            <CardDescription>
              {selectedSession ? "Selected session info" : "Click a session to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSession ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Session ID
                  </label>
                  <p className="font-mono text-sm mt-1 break-all">
                    {selectedSession.sessionId}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Key
                  </label>
                  <p className="font-mono text-sm mt-1 break-all">
                    {selectedSession.key}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Kind
                    </label>
                    <p className="text-sm mt-1 capitalize">{selectedSession.kind}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Model
                    </label>
                    <p className="text-sm mt-1">{selectedSession.model ?? "—"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Input Tokens
                    </label>
                    <p className="text-sm mt-1 font-mono">
                      {formatTokens(selectedSession.inputTokens ?? 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Output Tokens
                    </label>
                    <p className="text-sm mt-1 font-mono">
                      {formatTokens(selectedSession.outputTokens ?? 0)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Tokens
                  </label>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{formatTokens(selectedSession.totalTokens ?? 0)}</span>
                      <span className="text-muted-foreground">
                        / {formatTokens(selectedSession.contextTokens ?? 200000)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          (selectedSession.percentUsed ?? 0) > 80
                            ? "bg-destructive"
                            : (selectedSession.percentUsed ?? 0) > 50
                            ? "bg-primary"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${selectedSession.percentUsed ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Last Updated
                  </label>
                  <p className="text-sm mt-1">
                    {new Date(selectedSession.updatedAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Badge variant={selectedSession.systemSent ? "default" : "outline"}>
                    {selectedSession.systemSent ? "System Sent" : "No System"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Terminal className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a session to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
