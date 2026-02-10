import { NextRequest, NextResponse } from "next/server";
import { getAllAgents, createAgent, logActivity } from "@/lib/db";

export async function GET() {
  try {
    const agents = getAllAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Failed to get agents:", error);
    return NextResponse.json({ error: "Failed to get agents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.role) {
      return NextResponse.json(
        { error: "Name and role are required" },
        { status: 400 }
      );
    }

    const agent = createAgent({
      name: body.name,
      avatar: body.avatar,
      role: body.role,
      description: body.description,
      model: body.model,
      system_prompt: body.system_prompt,
      thinking: body.thinking,
      skills: body.skills,
      department: body.department,
    });

    logActivity({
      type: "agent_created",
      action: `Created agent "${agent.name}"`,
      entity_type: "agent",
      entity_id: agent.id,
      details: `Role: ${agent.role}, Model: ${agent.model}`,
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Failed to create agent:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
