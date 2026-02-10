import { NextResponse } from "next/server";
import { getSessions } from "@/lib/clawdbot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessions = await getSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to get sessions:", error);
    return NextResponse.json(
      { error: "Failed to get sessions", details: String(error) },
      { status: 500 }
    );
  }
}
