import { NextResponse } from "next/server";
import { getCronJobs, toggleCronJob, runCronJob } from "@/lib/clawdbot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cron = await getCronJobs();
    return NextResponse.json(cron);
  } catch (error) {
    console.error("Failed to get cron jobs:", error);
    return NextResponse.json(
      { error: "Failed to get cron jobs", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing job id" },
        { status: 400 }
      );
    }
    
    switch (action) {
      case "enable":
        await toggleCronJob(id, true);
        break;
      case "disable":
        await toggleCronJob(id, false);
        break;
      case "run":
        await runCronJob(id);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to perform cron action:", error);
    return NextResponse.json(
      { error: "Failed to perform cron action", details: String(error) },
      { status: 500 }
    );
  }
}
