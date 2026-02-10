"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  MessageSquare,
  Terminal,
  Clock,
} from "lucide-react";
import { formatAge, formatTokens, getHumanSessionName, getSessionDescription } from "@/lib/types";
import type { GatewayHealth, SessionInfo } from "@/lib/types";

interface StatusData {
  health: GatewayHealth;
  status: Record<string, unknown>;
  timestamp: number;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const statusData = await res.json();
      setData(statusData);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-hex-glow">Status</h1>
            <p className="text-muted-foreground">Gateway health and system overview</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const health = data?.health;
  const sessionsCount = health?.sessions?.count ?? 0;
  const recentSessions = health?.sessions?.recent ?? [];

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary text-hex-glow">Status</h1>
          <p className="text-muted-foreground">Gateway health and system overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hex-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gateway</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health?.ok ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">Online</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-bold text-destructive">Offline</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Response: {health?.durationMs ?? 0}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Terminal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heartbeat</CardTitle>
            <Zap className="h-4 w-4 text-primary animate-hex-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.heartbeatSeconds ? `${health.heartbeatSeconds / 60}m` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Poll interval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {recentSessions[0]?.model ?? "claude-opus-4-5"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Default agent model
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Connected messaging platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {health?.channelOrder?.map((channelId) => {
              const channel = health.channels[channelId];
              const label = health.channelLabels[channelId] ?? channelId;
              const isConnected = channel?.configured && (channel?.connected || channel?.probe?.ok);
              
              return (
                <div
                  key={channelId}
                  className="flex items-center justify-between p-4 rounded-lg bg-card border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isConnected ? "bg-green-500/10" : "bg-muted"}`}>
                      {channelId === "discord" ? (
                        <MessageSquare className={`h-5 w-5 ${isConnected ? "text-green-500" : "text-muted-foreground"}`} />
                      ) : (
                        <MessageSquare className={`h-5 w-5 ${isConnected ? "text-green-500" : "text-muted-foreground"}`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        {channel?.probe?.bot?.username ?? (channel?.linked ? "Linked" : "Not configured")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? "Connected" : "Offline"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Active conversations — each session is a separate chat context (Discord, cron jobs, sub-agents, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSessions.slice(0, 5).map((session: SessionInfo, index: number) => {
              const humanName = getHumanSessionName(session.key);
              const description = getSessionDescription(session);
              return (
              <div
                key={session.sessionId || session.key || index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{humanName}</p>
                    <p className="text-xs text-muted-foreground">
                      {description} • {formatAge(session.age ?? session.ageMs ?? 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {session.totalTokens !== undefined && (
                    <Badge variant="outline" className="font-mono">
                      {formatTokens(session.totalTokens)} tokens
                    </Badge>
                  )}
                  {session.percentUsed !== undefined && (
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
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
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
