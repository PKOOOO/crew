"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

/**
 * Phone → projector control.
 *
 * Two transports run in parallel:
 *  - Supabase Realtime broadcast: the phone and the projector each hold a
 *    WebSocket to Supabase, so cues travel between devices without touching
 *    the Vercel backend. Used whenever the env vars are present.
 *  - BroadcastChannel: same-browser fallback, so two windows on the projector
 *    laptop still work with no network at all.
 */

export const SCENE_CHANNEL_NAME = "wa-sim-scenes";

/** Control → display: go to this scene and play it. */
export type CueMessage = {
  kind: "cue";
  sceneIndex: number;
  /** Bumping this replays the same scene. */
  nonce: number;
  action: "play" | "next" | "prev" | "replay";
};

/** Display → control: what the projector is currently showing. */
export type StateMessage = {
  kind: "state";
  sceneIndex: number;
  started: boolean;
  /** The scene's events have finished playing — safe to advance. */
  finished: boolean;
};

/** Either side asking the other to re-announce itself. */
export type RequestMessage = { kind: "request" };

export type SyncMessage = CueMessage | StateMessage | RequestMessage;

export type SyncStatus = "connecting" | "online" | "local-only" | "error";

function isSyncMessage(value: unknown): value is SyncMessage {
  if (typeof value !== "object" || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === "cue" || kind === "state" || kind === "request";
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
/** Supabase renamed the anon key to "publishable key" — accept either. */
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the deployment has Supabase configured. */
export const hasRealtime = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Subscribes to the shared channel and returns a `send` for publishing.
 * Messages are echoed to the local BroadcastChannel as well, so a second
 * window on the same machine stays in sync even with no internet.
 */
export function useSceneChannel(onMessage: (message: SyncMessage) => void) {
  const [status, setStatus] = useState<SyncStatus>(
    hasRealtime ? "connecting" : "local-only",
  );
  const supabaseChannelRef = useRef<RealtimeChannel | null>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const deliver = (data: unknown) => {
      if (isSyncMessage(data)) onMessageRef.current(data);
    };

    // Same-browser transport — always on.
    const local = new BroadcastChannel(SCENE_CHANNEL_NAME);
    local.onmessage = (event: MessageEvent<unknown>) => deliver(event.data);
    localChannelRef.current = local;

    // Cross-device transport — only when configured.
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return () => {
        localChannelRef.current = null;
        local.close();
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 20 } },
    });

    const channel = supabase.channel(SCENE_CHANNEL_NAME, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "sync" }, ({ payload }) =>
      deliver(payload),
    );

    channel.subscribe((state) => {
      if (state === "SUBSCRIBED") setStatus("online");
      else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT")
        setStatus("error");
      else if (state === "CLOSED") setStatus("connecting");
    });

    supabaseChannelRef.current = channel;

    return () => {
      supabaseChannelRef.current = null;
      localChannelRef.current = null;
      void supabase.removeChannel(channel);
      local.close();
    };
  }, []);

  const send = useCallback((message: SyncMessage) => {
    localChannelRef.current?.postMessage(message);
    void supabaseChannelRef.current?.send({
      type: "broadcast",
      event: "sync",
      payload: message,
    });
  }, []);

  return { send, status };
}
