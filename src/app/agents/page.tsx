"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  RefreshCw,
  Bot,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  description: string | null;
  model: string;
  thinking: string;
  department: string | null;
  created_at: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();
      setAgents(data.agents);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const deleteAgent = async (id: string, name: string) => {
    if (!confirm(`Delete agent "${name}"?`)) return;
    
    try {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchAgents();
    } catch (err) {
      alert("Failed to delete agent");
    }
  };

  const getModelBadgeColor = (model: string) => {
    if (model.includes("opus")) return "bg-purple-500/10 text-purple-500";
    if (model.includes("sonnet")) return "bg-blue-500/10 text-blue-500";
    if (model.includes("haiku")) return "bg-green-500/10 text-green-500";
    return "bg-gray-500/10 text-gray-500";
  };

  const getModelShortName = (model: string) => {
    if (model.includes("opus")) return "Opus";
    if (model.includes("sonnet")) return "Sonnet";
    if (model.includes("haiku")) return "Haiku";
    return model.split("/").pop() || model;
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-hex-glow">Agents</h1>
            <p className="text-muted-foreground">Your AI workforce</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
            </Card>
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
          <h1 className="text-2xl font-bold text-primary text-hex-glow">Agents</h1>
          <p className="text-muted-foreground">Your AI workforce — {agents.length} agent{agents.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgents}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/agents/new">
              <Plus className="h-4 w-4" />
              New Agent
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Agent Grid */}
      {agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first agent to start building your AI workforce.
            </p>
            <Button asChild>
              <Link href="/agents/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                      {agent.avatar || "🤖"}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.role}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/agents/${agent.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteAgent(agent.id, agent.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agent.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {agent.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getModelBadgeColor(agent.model)}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {getModelShortName(agent.model)}
                  </Badge>
                  {agent.department && (
                    <Badge variant="secondary">{agent.department}</Badge>
                  )}
                  <Badge variant="outline" className="text-muted-foreground">
                    Thinking: {agent.thinking}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
