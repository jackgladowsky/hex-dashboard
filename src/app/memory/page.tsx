"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Brain,
  FileText,
  Save,
  X,
  Calendar,
  Search,
  Edit2,
} from "lucide-react";
import { formatFileSize, isDateFile, extractDate } from "@/lib/types";
import type { MemoryFile, MemoryFileContent } from "@/lib/types";

export default function MemoryPage() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MemoryFileContent | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/memory");
      if (!res.ok) throw new Error("Failed to fetch memory files");
      const data = await res.json();
      setFiles(data.files);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadFile = async (path: string) => {
    try {
      setFileLoading(true);
      setEditing(false);
      const res = await fetch(`/api/memory?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setSelectedFile(data);
      setEditContent(data.content);
    } catch (err) {
      setError(String(err));
    } finally {
      setFileLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    try {
      setSaving(true);
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selectedFile.path,
          content: editContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to save file");
      setSelectedFile({ ...selectedFile, content: editContent });
      setEditing(false);
      await fetchFiles(); // Refresh file list
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Filter files by search
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate MEMORY.md and date files
  const memoryMd = filteredFiles.find((f) => f.name === "MEMORY.md");
  const dateFiles = filteredFiles.filter((f) => isDateFile(f.name));
  const otherFiles = filteredFiles.filter(
    (f) => f.name !== "MEMORY.md" && !isDateFile(f.name)
  );

  if (loading && files.length === 0) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-hex-glow">Memory</h1>
            <p className="text-muted-foreground">Browse and edit memory files</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary text-hex-glow">Memory</h1>
          <p className="text-muted-foreground">
            {files.length} file{files.length !== 1 ? "s" : ""} in memory
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchFiles}
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
        {/* File List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Files</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              <div className="px-4 pb-4 space-y-1">
                {/* MEMORY.md */}
                {memoryMd && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      Long-term Memory
                    </p>
                    <button
                      onClick={() => loadFile(memoryMd.relativePath)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedFile?.path === memoryMd.relativePath
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{memoryMd.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(memoryMd.size)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Date Files */}
                {dateFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      Daily Notes
                    </p>
                    {dateFiles.map((file) => {
                      const date = extractDate(file.name);
                      return (
                        <button
                          key={file.path}
                          onClick={() => loadFile(file.relativePath)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedFile?.path === file.relativePath
                              ? "bg-primary/10 border border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {date}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Other Files */}
                {otherFiles.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      Other Files
                    </p>
                    {otherFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => loadFile(file.relativePath)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedFile?.path === file.relativePath
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* File Viewer/Editor */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedFile?.path ?? "Select a file"}
                </CardTitle>
                {selectedFile && (
                  <CardDescription>
                    {formatFileSize(selectedFile.size)} • Last modified{" "}
                    {new Date(selectedFile.modifiedAt).toLocaleString()}
                  </CardDescription>
                )}
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(false);
                          setEditContent(selectedFile.content);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveFile}
                        disabled={saving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {fileLoading ? (
              <Skeleton className="h-[500px] w-full" />
            ) : selectedFile ? (
              <ScrollArea className="h-[500px] rounded-lg border bg-muted/30">
                {editing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[500px] p-4 bg-transparent font-mono text-sm resize-none focus:outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <pre className="p-4 font-mono text-sm whitespace-pre-wrap break-words">
                    {selectedFile.content}
                  </pre>
                )}
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <Brain className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a file to view its contents</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
