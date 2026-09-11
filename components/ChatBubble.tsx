"use client";

interface ChatBubbleProps {
  role: "user" | "ai";
  content: string;
}

export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed ${
          isUser
            ? "bg-primary text-white rounded-br-md"
            : "bg-card-bg border border-card-border text-foreground rounded-bl-md shadow-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
