"use client";

import { Mic } from "lucide-react";
import { Tail } from "@/components/MessageBubble";

export type TypingIndicatorProps = {
  senderName?: string;
  senderColor?: string;
  isFirstInGroup: boolean;
  /** Holding the mic instead of typing — a pulsing mic replaces the dots. */
  voice?: boolean;
};

export default function TypingIndicator({
  senderName,
  senderColor,
  isFirstInGroup,
  voice = false,
}: TypingIndicatorProps) {
  return (
    <div
      className="flex justify-start"
      style={{ marginTop: isFirstInGroup ? 20 : 6 }}
      aria-label={voice ? "recording audio" : "typing"}
    >
      <div
        className={`relative max-w-[min(72%,900px)] rounded-2xl bg-white shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
          isFirstInGroup ? "rounded-tl-none" : ""
        }`}
      >
        {isFirstInGroup ? <Tail outgoing={false} /> : null}

        <div className="px-6 py-4">
          {senderName && isFirstInGroup ? (
            <div
              className="text-[32px] font-bold leading-tight"
              style={{ color: senderColor ?? "#00a884" }}
            >
              {senderName}
            </div>
          ) : null}

          <div className="flex h-[56px] items-center gap-3">
            {voice ? (
              <Mic
                className="h-[46px] w-[46px] text-[#54656f]"
                strokeWidth={2.2}
                style={{ animation: "wa-mic-pulse 1.3s ease-in-out infinite" }}
              />
            ) : (
              <>
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="block h-[18px] w-[18px] rounded-full bg-[#8696a0]"
      style={{
        animation: "wa-typing-dot 1.2s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
