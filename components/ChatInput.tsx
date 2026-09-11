"use client";

import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed.length < 1 || disabled || loading) return;
    if (trimmed.length > 500) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = value.length;
  const isOverLimit = charCount > 500;

  return (
    <div className="border-t border-card-border bg-card-bg p-4">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tuliskan pikiranmu..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-card-border bg-background px-4 py-3 text-[15px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          style={{ maxHeight: "120px", minHeight: "44px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || loading || !value.trim() || isOverLimit}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
      <div className="mt-1 flex justify-end">
        <span className={`text-xs ${isOverLimit ? "text-red-500 font-medium" : "text-muted"}`}>
          {charCount}/500
        </span>
      </div>
    </div>
  );
}
