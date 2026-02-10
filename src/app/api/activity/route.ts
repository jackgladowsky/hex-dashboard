import { NextResponse } from "next/server";
import { getActivityLogs, createActivityLog, getActivityLogCount } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const type = url.searchParams.get("type") ?? undefined;
    const since = url.searchParams.get("since")
      ? parseInt(url.searchParams.get("since")!)
      : undefined;

    const logs = getActivityLogs({ limit, offset, type, since });
    const total = getActivityLogCount({ type, since });

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to get activity logs:", error);
    return NextResponse.json(
      { error: "Failed to get activity logs", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, source, action, details, session_id } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing type field" },
        { status: 400 }
      );
    }

    const id = createActivityLog({
      type,
      source,
      action,
      details: typeof details === "string" ? details : JSON.stringify(details),
      session_id,
    });

    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error("Failed to create activity log:", error);
    return NextResponse.json(
      { error: "Failed to create activity log", details: String(error) },
      { status: 500 }
    );
  }
}
