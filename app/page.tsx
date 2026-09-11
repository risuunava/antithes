"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChallengeLevelSelector from "@/components/ChallengeLevelSelector";
import type { ChallengeLevel } from "@/types";

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";
  let userId = localStorage.getItem("tc_user_id");
  if (!userId) {
    userId = "anon-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("tc_user_id", userId);
  }
  return userId;
}

export default function Home() {
  const router = useRouter();
  const [level, setLevel] = useState<ChallengeLevel>("logical");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const userId = getOrCreateUserId();
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, challenge_level: level }),
      });
      const data = await res.json();
      if (data.session_id) {
        router.push(`/session/${data.session_id}`);
      }
    } catch {
      alert("Gagal membuat sesi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Uji Pikiranmu, Dibedah AI
          </h1>
          <p className="text-muted text-[15px] leading-relaxed max-w-sm">
            AI yang membantu kamu menguji pikiranmu sendiri, bukan yang selalu membenarkan.
          </p>
        </div>

        <ChallengeLevelSelector selected={level} onSelect={setLevel} />

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-full bg-foreground text-background py-3.5 text-base font-semibold transition-colors hover:bg-black disabled:opacity-50"
        >
          {loading ? "Membuat sesi..." : "Mulai Sesi"}
        </button>

        <p className="text-xs text-muted leading-relaxed max-w-xs">
          Aplikasi ini untuk latihan berpikir kritis, bukan pengganti konsultasi profesional.
        </p>
      </div>
    </div>
  );
}
