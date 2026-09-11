export type ChallengeLevel = "friendly" | "logical" | "aggressive";

export type SessionStatus = "active" | "ended";

export type MessageRole = "user" | "ai";

export interface Session {
  id: string;
  user_id: string;
  challenge_level: ChallengeLevel;
  status: SessionStatus;
  guardrail_triggered: boolean;
  belief: string | null;
  bias: string | null;
  reframe: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface InsightResult {
  belief: string;
  bias: string;
  reframe: string;
}
