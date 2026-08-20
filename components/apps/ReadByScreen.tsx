"use client";

import { useMemo } from "react";
import { MessageInfoScreen } from "@/components/MessageInspect";
import { buildSenderColors } from "@/lib/sender-colors";
import type { InfoRow } from "@/types/scene";

export type ReadByScreenProps = {
  /** The message echoed at the top of the screen. */
  text: string;
  timestamp: string;
  readBy: InfoRow[];
  deliveredTo?: InfoRow[];
  /** How long one pass down the list takes, ms. */
  scrollMs?: number;
  /** Passes to make: 4 is down, up, down, up. */
  sweeps?: number;
  autoStart?: boolean;
  onFinished?: () => void;
};

/**
 * Message info on its own — no chat behind it, no pointer opening it. Just
 * the message and the list of everyone who read it, going up and down while
 * the room reads the same time over and over.
 */
export default function ReadByScreen({
  text,
  timestamp,
  readBy,
  deliveredTo,
  scrollMs,
  sweeps,
  autoStart = false,
  onFinished,
}: ReadByScreenProps) {
  // The same colours the crew carry in every chat, so the avatars here match
  // the ones the audience has been watching all night.
  const senderColors = useMemo(
    () => buildSenderColors([...readBy, ...(deliveredTo ?? [])].map((r) => r.name)),
    [readBy, deliveredTo],
  );

  return (
    <div className="relative h-full w-full">
      <MessageInfoScreen
        text={text}
        timestamp={timestamp}
        readBy={readBy}
        deliveredTo={deliveredTo}
        senderColors={senderColors}
        scrollMs={scrollMs}
        sweeps={sweeps}
        paused={!autoStart}
        onFinished={onFinished}
      />
    </div>
  );
}
