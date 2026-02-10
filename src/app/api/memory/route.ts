import { NextResponse } from "next/server";
import { listMemoryFiles, readMemoryFile, writeMemoryFile } from "@/lib/memory";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  
  try {
    if (path) {
      // Read specific file
      const file = await readMemoryFile(path);
      return NextResponse.json(file);
    } else {
      // List all files
      const files = await listMemoryFiles();
      return NextResponse.json({ files });
    }
  } catch (error) {
    console.error("Failed to read memory:", error);
    return NextResponse.json(
      { error: "Failed to read memory", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path, content } = body;
    
    if (!path || content === undefined) {
      return NextResponse.json(
        { error: "Missing path or content" },
        { status: 400 }
      );
    }
    
    await writeMemoryFile(path, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to write memory:", error);
    return NextResponse.json(
      { error: "Failed to write memory", details: String(error) },
      { status: 500 }
    );
  }
}
