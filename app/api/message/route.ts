import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { generateGeminiResponse } from "@/lib/geminiClient";
import { checkGuardrail } from "@/lib/guardrail";
import { getSystemPrompt, GUARDRAIL_PROMPT } from "@/lib/prompts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, message } = body as {
      session_id: string;
      message: string;
    };

    if (!session_id || !message?.trim()) {
      return NextResponse.json({ error: "session_id and message required" }, { status: 400 });
    }

    const trimmed = message.trim();

    if (trimmed.length > 500) {
      return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
    }

    const guardrailHit = checkGuardrail(trimmed);

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("challenge_level, guardrail_triggered")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const guardrailActive = guardrailHit || session.guardrail_triggered;

    if (guardrailHit && !session.guardrail_triggered) {
      await supabase
        .from("sessions")
        .update({ guardrail_triggered: true })
        .eq("id", session_id);
    }

    const { error: userMsgError } = await supabase
      .from("messages")
      .insert({
        session_id,
        role: "user",
        content: trimmed,
      });

    if (userMsgError) {
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    const { data: historyRows } = await supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    const history = (historyRows || []).map((row) => ({
      role: row.role as "user" | "ai",
      content: row.content,
    }));

    const systemPrompt = guardrailActive
      ? GUARDRAIL_PROMPT
      : getSystemPrompt(session.challenge_level);

    const aiReply = await generateGeminiResponse(systemPrompt, history);

    const { error: aiMsgError } = await supabase
      .from("messages")
      .insert({
        session_id,
        role: "ai",
        content: aiReply,
      });

    if (aiMsgError) {
      return NextResponse.json({ error: "Failed to save AI reply" }, { status: 500 });
    }

    return NextResponse.json({
      reply: aiReply,
      guardrail_active: guardrailActive,
    });
  } catch (err) {
    console.error("Message API error:", err);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
