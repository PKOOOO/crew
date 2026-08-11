"use client";

import { Tail } from "@/components/MessageBubble";

export type TypingIndicatorProps = {
  senderName?: string;
  senderColor?: string;
  isFirstInGroup: boolean;
};

export default function TypingIndicator({
  senderName,
  senderColor,
  isFirstInGroup,
}: TypingIndicatorProps) {
  return (
    <div
      className="flex justify-start"
      style={{ marginTop: isFirstInGroup ? 8 : 2 }}
      aria-label="typing"
    >
      <div
        className={`relative max-w-[min(65%,620px)] rounded-lg bg-white shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
          isFirstInGroup ? "rounded-tl-none" : ""
        }`}
      >
        {isFirstInGroup ? <Tail outgoing={false} /> : null}

        <div className="px-2.5 py-1.5">
          {senderName && isFirstInGroup ? (
            <div
              className="text-[15px] font-bold leading-tight"
              style={{ color: senderColor ?? "#00a884" }}
            >
              {senderName}
            </div>
          ) : null}

          <div className="flex h-[24px] items-center gap-1.5">
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="block h-[9px] w-[9px] rounded-full bg-[#8696a0]"
      style={{
        animation: "wa-typing-dot 1.2s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
