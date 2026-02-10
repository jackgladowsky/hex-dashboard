"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Calendar,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  AlertCircle,
} from "lucide-react";
import { formatAge, formatDuration } from "@/lib/types";
import type { CronJob, CronListResponse } from "@/lib/types";

export default function CronPage() {
  const [data, setData] = useState<CronListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCron = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cron");
      if (!res.ok) throw new Error("Failed to fetch cron jobs");
      const cronData = await res.json();
      setData(cronData);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (id: string, action: "enable" | "disable" | "run") => {
    try {
      setActionLoading(id);
      const res = await fetch("/api/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error("Failed to perform action");
      await fetchCron();
    } catch (err) {
      setError(String(err));
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCron();
    const interval = setInterval(fetchCron, 30000);
    return () => clearInterval(interval);
  }, []);

  const jobs = data?.jobs ?? [];

  const formatNextRun = (ms: number) => {
    const now = Date.now();
    const diff = ms - now;
    if (diff < 0) return "Overdue";
    if (diff < 60000) return "< 1 min";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours`;
    return `${Math.floor(diff / 86400000)} days`;
  };

  const formatSchedule = (schedule: CronJob["schedule"]) => {
    const { expr, tz } = schedule;
    // Simple cron expression to human readable
    const parts = expr.split(" ");
    if (parts.length === 5) {
      const [min, hour, dom, mon, dow] = parts;
      if (dom === "*" && mon === "*") {
        if (dow === "*") {
          return `Daily at ${hour}:${min.padStart(2, "0")} (${tz})`;
        } else if (dow === "0") {
          return `Weekly on Sundays at ${hour}:${min.padStart(2, "0")} (${tz})`;
        }
      }
    }
    return `${expr} (${tz})`;
  };

  if (loading && !data) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-hex-glow">Cron Jobs</h1>
            <p className="text-muted-foreground">Scheduled tasks — things I do automatically (morning briefings, reminders, weekly cleanups)</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
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
          <h1 className="text-2xl font-bold text-primary text-hex-glow">Cron Jobs</h1>
          <p className="text-muted-foreground">
            {jobs.length} scheduled task{jobs.length !== 1 ? "s" : ""} — things I do automatically
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCron}
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

      {/* Job Cards */}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className={!job.enabled ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${job.enabled ? "bg-primary/10" : "bg-muted"}`}>
                    <Calendar className={`h-5 w-5 ${job.enabled ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{job.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {formatSchedule(job.schedule)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={job.enabled ? "default" : "secondary"}>
                    {job.enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status Grid */}
              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Next Run</p>
                    <p className="text-sm font-medium">
                      {job.state.nextRunAtMs ? formatNextRun(job.state.nextRunAtMs) : "—"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Run</p>
                    <p className="text-sm font-medium">
                      {job.state.lastRunAtMs
                        ? formatAge(Date.now() - job.state.lastRunAtMs)
                        : "Never"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {job.state.lastStatus === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : job.state.lastStatus === "error" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Last Status</p>
                    <p className="text-sm font-medium capitalize">
                      {job.state.lastStatus ?? "Unknown"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">
                      {job.state.lastDurationMs
                        ? formatDuration(job.state.lastDurationMs)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Preview */}
              <div className="p-3 rounded-lg bg-muted/50 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="text-sm line-clamp-2">{job.payload.message}</p>
              </div>

              {/* Delivery Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                {job.payload.channel && (
                  <span>Channel: {job.payload.channel}</span>
                )}
                {job.payload.to && (
                  <span className="font-mono">To: {job.payload.to}</span>
                )}
                <span>Session: {job.sessionTarget}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performAction(job.id, job.enabled ? "disable" : "enable")}
                  disabled={actionLoading === job.id}
                  className="gap-2"
                >
                  {job.enabled ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Enable
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => performAction(job.id, "run")}
                  disabled={actionLoading === job.id || !job.enabled}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No cron jobs configured</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
