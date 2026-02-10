import { NextRequest, NextResponse } from "next/server";
import { getAllTasks, createTask, logActivity } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const assigned_agent = searchParams.get("agent") ?? undefined;

    const tasks = getAllTasks({ status, assigned_agent });
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return NextResponse.json({ error: "Failed to get tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const task = createTask({
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      assigned_agent: body.assigned_agent,
      deadline: body.deadline,
      tags: body.tags,
    });

    logActivity({
      type: "task_created",
      action: `Created task "${task.title}"`,
      entity_type: "task",
      entity_id: task.id,
      details: `Priority: ${task.priority}`,
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
