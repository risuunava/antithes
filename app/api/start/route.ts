import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { ChallengeLevel } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, challenge_level } = body as {
      user_id: string;
      challenge_level: ChallengeLevel;
    };

    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const validLevels: ChallengeLevel[] = ["friendly", "logical", "aggressive"];
    const level = validLevels.includes(challenge_level) ? challenge_level : "logical";

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id,
        challenge_level: level,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session_id: data.id });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
