import { readdir, readFile, writeFile, stat } from "fs/promises";
import { join, basename } from "path";
import { homedir } from "os";

export interface MemoryFile {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  modifiedAt: number;
  isDirectory: boolean;
}

export interface MemoryFileContent {
  path: string;
  content: string;
  size: number;
  modifiedAt: number;
}

const MEMORY_DIR = join(homedir(), "clawd", "memory");
const MEMORY_MD = join(homedir(), "clawd", "MEMORY.md");

export async function listMemoryFiles(): Promise<MemoryFile[]> {
  const files: MemoryFile[] = [];
  
  // Add MEMORY.md if it exists
  try {
    const memStat = await stat(MEMORY_MD);
    files.push({
      name: "MEMORY.md",
      path: MEMORY_MD,
      relativePath: "MEMORY.md",
      size: memStat.size,
      modifiedAt: memStat.mtimeMs,
      isDirectory: false,
    });
  } catch {
    // MEMORY.md doesn't exist
  }
  
  // List memory directory files
  try {
    const entries = await readdir(MEMORY_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      
      const fullPath = join(MEMORY_DIR, entry.name);
      const fileStat = await stat(fullPath);
      
      files.push({
        name: entry.name,
        path: fullPath,
        relativePath: `memory/${entry.name}`,
        size: fileStat.size,
        modifiedAt: fileStat.mtimeMs,
        isDirectory: entry.isDirectory(),
      });
    }
  } catch (error) {
    console.error("Failed to list memory directory:", error);
  }
  
  // Sort by modified time, newest first
  files.sort((a, b) => b.modifiedAt - a.modifiedAt);
  
  return files;
}

export async function readMemoryFile(relativePath: string): Promise<MemoryFileContent> {
  let fullPath: string;
  
  if (relativePath === "MEMORY.md") {
    fullPath = MEMORY_MD;
  } else if (relativePath.startsWith("memory/")) {
    fullPath = join(homedir(), "clawd", relativePath);
  } else {
    fullPath = join(MEMORY_DIR, relativePath);
  }
  
  const content = await readFile(fullPath, "utf-8");
  const fileStat = await stat(fullPath);
  
  return {
    path: relativePath,
    content,
    size: fileStat.size,
    modifiedAt: fileStat.mtimeMs,
  };
}

export async function writeMemoryFile(relativePath: string, content: string): Promise<void> {
  let fullPath: string;
  
  if (relativePath === "MEMORY.md") {
    fullPath = MEMORY_MD;
  } else if (relativePath.startsWith("memory/")) {
    fullPath = join(homedir(), "clawd", relativePath);
  } else {
    fullPath = join(MEMORY_DIR, relativePath);
  }
  
  await writeFile(fullPath, content, "utf-8");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isMarkdownFile(name: string): boolean {
  return name.endsWith(".md");
}

export function isDateFile(name: string): boolean {
  // Matches YYYY-MM-DD.md or YYYY-MM-DD-*.md
  return /^\d{4}-\d{2}-\d{2}(-.*)?\.md$/.test(name);
}

export function extractDate(name: string): string | null {
  const match = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}
