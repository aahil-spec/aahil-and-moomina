import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { roomId: string; hostId: string; hostName: string };
    const { roomId, hostId, hostName } = body;

    if (!roomId || !hostId || !hostName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({ id: roomId, host_id: hostId, host_name: hostName })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/rooms]", error);
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }

    return NextResponse.json({ room: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/rooms] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
