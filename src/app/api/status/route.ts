import { NextResponse } from "next/server";
import { getGatewayHealth, getGatewayStatus } from "@/lib/clawdbot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [health, status] = await Promise.all([
      getGatewayHealth(),
      getGatewayStatus(),
    ]);
    
    return NextResponse.json({
      health,
      status,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to get gateway status:", error);
    return NextResponse.json(
      { error: "Failed to get gateway status", details: String(error) },
      { status: 500 }
    );
  }
}
