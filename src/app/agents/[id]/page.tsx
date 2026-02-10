"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Loader2, Trash2, FlaskConical, Send } from "lucide-react";
import Link from "next/link";

const MODELS = [
  { value: "claude-sonnet-4", label: "Claude Sonnet 4", description: "Fast, capable" },
  { value: "claude-opus-4", label: "Claude Opus 4", description: "Most capable" },
  { value: "claude-haiku-3", label: "Claude Haiku 3", description: "Fastest" },
  { value: "gpt-4o", label: "GPT-4o", description: "OpenAI flagship" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast & cheap" },
];

const THINKING_LEVELS = [
  { value: "off", label: "Off", description: "No extended thinking" },
  { value: "low", label: "Low", description: "Brief reasoning" },
  { value: "medium", label: "Medium", description: "Moderate reasoning" },
  { value: "high", label: "High", description: "Deep reasoning" },
];

const DEPARTMENTS = [
  "Research",
  "Engineering",
  "Communications",
  "Analysis",
  "Creative",
  "Operations",
];

const EMOJI_OPTIONS = ["🤖", "🧠", "🔬", "💻", "📊", "✍️", "🎨", "⚡", "🦾", "👁️", "🔮", "🛠️"];

interface Agent {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  description: string | null;
  model: string;
  system_prompt: string | null;
  thinking: string;
  skills: string | null;
  department: string | null;
  created_at: number;
  updated_at: number;
}

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPrompt, setTestPrompt] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    avatar: "🤖",
    role: "",
    description: "",
    model: "claude-sonnet-4",
    thinking: "low",
    department: "",
    system_prompt: "",
  });

  // Load agent data
  useEffect(() => {
    async function loadAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Agent not found");
          } else {
            throw new Error("Failed to load agent");
          }
          return;
        }

        const data = await res.json();
        const agent: Agent = data.agent;

        setForm({
          name: agent.name,
          avatar: agent.avatar || "🤖",
          role: agent.role,
          description: agent.description || "",
          model: agent.model,
          thinking: agent.thinking || "low",
          department: agent.department || "",
          system_prompt: agent.system_prompt || "",
        });
      } catch (err) {
        setError("Failed to load agent");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [agentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.role) {
      alert("Name and role are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update agent");

      router.push("/agents");
    } catch (err) {
      alert("Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete agent");

      router.push("/agents");
    } catch (err) {
      alert("Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async () => {
    if (!testPrompt.trim()) {
      alert("Enter a test prompt");
      return;
    }

    setTesting(true);
    setTestResponse("");
    
    try {
      // Simulate a test response for now - in production this would call the actual agent
      // This could be extended to call a real test endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTestResponse(
        `**Agent Response (simulated)**\n\n` +
        `Model: ${form.model}\n` +
        `Thinking: ${form.thinking}\n\n` +
        `This is a simulated response. To enable real testing, connect this to your agent execution endpoint.\n\n` +
        `Your prompt was: "${testPrompt}"`
      );
    } catch (err) {
      setTestResponse("Error: Failed to test agent");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-destructive">Error</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary text-hex-glow">
              {form.avatar} Edit Agent
            </h1>
            <p className="text-muted-foreground">
              Modify {form.name || "agent"} configuration
            </p>
          </div>
        </div>

        {/* Delete Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{form.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Agent Details</CardTitle>
            <CardDescription>
              Update your agent&apos;s identity and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar & Name */}
            <div className="flex gap-4">
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex flex-wrap gap-2 max-w-[200px]">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, avatar: emoji })}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-colors ${
                        form.avatar === emoji
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Atlas"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Research Analyst"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this agent do? What are they good at?"
                rows={2}
              />
            </div>

            {/* Model & Department */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={form.model}
                  onValueChange={(value) => setForm({ ...form, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(value) => setForm({ ...form, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Thinking Level */}
            <div className="space-y-2">
              <Label>Thinking Level</Label>
              <Select
                value={form.thinking}
                onValueChange={(value) => setForm({ ...form, thinking: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THINKING_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span>{level.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {level.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                value={form.system_prompt}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                placeholder="Custom instructions for this agent. Leave empty to use defaults."
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This will be prepended to the agent&apos;s system prompt. Use it to define personality, constraints, or special instructions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Agent Panel */}
        <Card className="mt-6">
          <CardHeader className="cursor-pointer" onClick={() => setShowTestPanel(!showTestPanel)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Test Agent</CardTitle>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTestPanel(!showTestPanel);
                }}
              >
                {showTestPanel ? "Hide" : "Show"}
              </Button>
            </div>
            <CardDescription>
              Send a test prompt to preview how this agent responds
            </CardDescription>
          </CardHeader>
          
          {showTestPanel && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test_prompt">Test Prompt</Label>
                <Textarea
                  id="test_prompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter a test message for the agent..."
                  rows={3}
                />
              </div>
              
              <Button
                type="button"
                onClick={handleTest}
                disabled={testing || !testPrompt.trim()}
                className="gap-2"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Test
              </Button>

              {testResponse && (
                <div className="space-y-2">
                  <Label>Response</Label>
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {testResponse}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/agents">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
