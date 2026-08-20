"use client";

/**
 * A phone-keyboard tap, synthesized rather than sampled.
 *
 * The whole sound is one very short burst of band-limited noise. Two bounds
 * matter and both are audible mistakes if you get them wrong: let low
 * frequencies through and it thumps like a drum, let high ones through and it
 * rings thin and metallic. So the noise is high-passed to strip the body and
 * low-passed to strip the hiss, leaving a dry mid-range tick that dies in
 * under 20ms — which is all a key press actually is.
 *
 * Synthesized rather than sampled so a fast run of keys never sounds like one
 * clip on repeat, and so overlapping presses need no pool of audio elements.
 */

export type KeyClickVariant = "tap" | "soft" | "click";
export type KeyClick = (variant?: KeyClickVariant) => void;

/** Noise source length. The envelope cuts it far shorter than this. */
const NOISE_MS = 30;
/** Below this is body — the drum thump. Cut it. */
const LOW_CUT_HZ = 700;
/** Above this is hiss — the metallic ring. Cut that too. */
const HIGH_CUT_HZ = 3000;
/** How fast the tick dies. Keyboard taps are near-instant. */
const DECAY_S = 0.016;

export function createKeyClick(): KeyClick {
  let context: AudioContext | null = null;
  let noise: AudioBuffer | null = null;

  return (variant: KeyClickVariant = "tap") => {
    try {
      context ??= new AudioContext();
      if (context.state === "suspended") void context.resume();

      const ctx = context;
      const now = ctx.currentTime;

      if (!noise) {
        const length = Math.floor(ctx.sampleRate * (NOISE_MS / 1000));
        noise = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let index = 0; index < length; index += 1) {
          const fade = 1 - index / length;
          data[index] = (Math.random() * 2 - 1) * fade * fade;
        }
      }

      // Backspace is the same key, hit lighter. A mouse button is a harder,
      // brighter snap than a key — same burst, wider band, more level.
      const soft = variant === "soft";
      const mouse = variant === "click";
      // Per-key drift, so a fast run never sounds like one sample on repeat.
      const drift = 0.92 + Math.random() * 0.16;

      const source = ctx.createBufferSource();
      source.buffer = noise;
      source.playbackRate.value = drift;

      const stripBody = ctx.createBiquadFilter();
      stripBody.type = "highpass";
      stripBody.frequency.value = LOW_CUT_HZ;
      stripBody.Q.value = 0.5;

      const stripHiss = ctx.createBiquadFilter();
      stripHiss.type = "lowpass";
      const band = soft
        ? HIGH_CUT_HZ * 0.75
        : mouse
          ? HIGH_CUT_HZ * 1.9
          : HIGH_CUT_HZ;
      stripHiss.frequency.value = band * drift;
      stripHiss.Q.value = 0.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        soft ? 0.07 : mouse ? 0.3 : 0.13,
        now + 0.001,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + (mouse ? DECAY_S * 1.4 : DECAY_S),
      );

      source
        .connect(stripBody)
        .connect(stripHiss)
        .connect(gain)
        .connect(ctx.destination);
      source.start(now);
      source.stop(now + NOISE_MS / 1000);
    } catch {
      // No audio available — typing continues silently.
    }
  };
}
