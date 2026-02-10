"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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

export default function NewAgentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.role) {
      alert("Name and role are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to create agent");
      
      router.push("/agents");
    } catch (err) {
      alert("Failed to create agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/agents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary text-hex-glow">New Agent</h1>
          <p className="text-muted-foreground">Create a new AI agent for your workforce</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Agent Details</CardTitle>
            <CardDescription>
              Define your agent&apos;s identity and capabilities
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
            Create Agent
          </Button>
        </div>
      </form>
    </div>
  );
}
