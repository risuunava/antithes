"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatBubble from "@/components/ChatBubble";
import ChatInput from "@/components/ChatInput";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [guardrailActive, setGuardrailActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const { supabase } = await import("@/lib/supabaseClient");
        const { data, error } = await supabase
          .from("messages")
          .select("role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (error) {
          router.push("/");
          return;
        }

        if (data && data.length > 0) {
          setMessages(
            data.map((row) => ({
              role: row.role as "user" | "ai",
              content: row.content,
            }))
          );
        }
      } catch {
        if (!cancelled) router.push("/");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  const handleSend = async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim pesan");
      }

      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "ai", content: data.reply },
      ]);

      if (data.guardrail_active) {
        setGuardrailActive(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted">Memuat sesi...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-lg">
          {guardrailActive && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Mode suportif aktif. AI tidak akan mengajukan pertanyaan menantang.
            </div>
          )}

          {messages.length === 0 && (
            <div className="text-center text-muted py-12">
              <p className="text-lg font-medium mb-2">Mulai percakapan</p>
              <p className="text-sm">Tuliskan pikiran yang ingin kamu uji</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-card-bg border border-card-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-medium">
            Tutup
          </button>
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={loading} loading={loading} />
    </div>
  );
}
