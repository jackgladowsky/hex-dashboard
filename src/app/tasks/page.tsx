"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  RefreshCw,
  ListTodo,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  Eye,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "assigned" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_agent: string | null;
  created_at: number;
}

interface Agent {
  id: string;
  name: string;
  avatar: string | null;
}

const STATUS_COLUMNS = [
  { key: "backlog", label: "Backlog", icon: Circle },
  { key: "assigned", label: "Assigned", icon: Clock },
  { key: "in_progress", label: "In Progress", icon: ArrowRight },
  { key: "review", label: "Review", icon: Eye },
  { key: "done", label: "Done", icon: CheckCircle2 },
] as const;

const PRIORITY_COLORS = {
  low: "bg-gray-500/10 text-gray-500",
  medium: "bg-blue-500/10 text-blue-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, agentsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/agents"),
      ]);
      
      if (!tasksRes.ok || !agentsRes.ok) throw new Error("Failed to fetch data");
      
      const tasksData = await tasksRes.json();
      const agentsData = await agentsRes.json();
      
      setTasks(tasksData.tasks);
      setAgents(agentsData.agents);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle }),
      });
      
      if (!res.ok) throw new Error("Failed to create task");
      
      setNewTaskTitle("");
      setShowNewTask(false);
      fetchData();
    } catch (err) {
      alert("Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) throw new Error("Failed to update task");
      fetchData();
    } catch (err) {
      alert("Failed to update task");
    }
  };

  const getAgentById = (id: string | null) => {
    if (!id) return null;
    return agents.find((a) => a.id === id);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t) => t.status === status);
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-hex-glow">Tasks</h1>
            <p className="text-muted-foreground">Manage your work</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary text-hex-glow">Tasks</h1>
          <p className="text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowNewTask(true)}>
            <Plus className="h-4 w-4" />
            New Task
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

      {/* Quick Add */}
      {showNewTask && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createTask()}
                placeholder="Task title..."
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                autoFocus
              />
              <Button onClick={createTask}>Add</Button>
              <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4 h-[calc(100vh-220px)] overflow-hidden">
        {STATUS_COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.key);
          const Icon = column.icon;
          
          return (
            <div key={column.key} className="flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{column.label}</span>
                <Badge variant="secondary" className="ml-auto">
                  {columnTasks.length}
                </Badge>
              </div>
              
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {columnTasks.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const agent = getAgentById(task.assigned_agent);
                    return (
                      <Card 
                        key={task.id} 
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <CardContent className="p-3 space-y-2">
                          <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                          
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline" 
                              className={PRIORITY_COLORS[task.priority]}
                            >
                              {task.priority}
                            </Badge>
                            
                            {agent && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span>{agent.avatar || "🤖"}</span>
                                <span>{agent.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Quick status buttons */}
                          <div className="flex gap-1 pt-1">
                            {column.key !== "done" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => {
                                  const nextStatus = STATUS_COLUMNS[
                                    STATUS_COLUMNS.findIndex((c) => c.key === column.key) + 1
                                  ]?.key;
                                  if (nextStatus) updateTaskStatus(task.id, nextStatus);
                                }}
                              >
                                Move →
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
