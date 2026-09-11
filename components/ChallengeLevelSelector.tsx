"use client";

import type { ChallengeLevel } from "@/types";

interface ChallengeLevelSelectorProps {
  selected: ChallengeLevel;
  onSelect: (level: ChallengeLevel) => void;
}

const levels: { value: ChallengeLevel; label: string; description: string }[] = [
  { value: "friendly", label: "Friendly", description: "Hangat & lembut, tetap kritis" },
  { value: "logical", label: "Logical", description: "Netral, fokus logika & bukti" },
  { value: "aggressive", label: "Aggressive", description: "Tajam & langsung, menyerang argumen" },
];

export default function ChallengeLevelSelector({ selected, onSelect }: ChallengeLevelSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Pilih Level Tantangan:</span>
      <div className="flex gap-2">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => onSelect(level.value)}
            className={`flex-1 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
              selected === level.value
                ? "bg-primary text-white shadow-md"
                : "bg-card-bg border border-card-border text-foreground hover:border-primary"
            }`}
          >
            <div>{level.label}</div>
            <div className={`text-xs mt-0.5 font-normal ${selected === level.value ? "text-white/80" : "text-muted"}`}>
              {level.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
