Create /components/MessageBubble.tsx for the desktop chat panel:
- Props: sender ("me" | string), text, timestamp, senderName?, senderColor?, isDeleted?, isFirstInGroup (boolean)
- Outgoing ("me"): bubble color #d9fdd3, right-aligned, max-width ~65% of panel, tail only rendered when isFirstInGroup is true (small triangle notch), tighter margin-top (2px) when NOT first in group, normal margin (8px) when first
- Incoming: white bubble #fff, left-aligned, same tail/spacing logic
- Timestamp + checkmarks render INLINE at the end of the message text (not a separate footer row) — mimic real WhatsApp: text should wrap and the "HH:MM ✓✓" sits trailing on the same line as the last words, floated right within the bubble using a small inline-block span with slight top margin
- Checkmarks: single grey check (sent), double grey check (delivered), double blue check (read) — accept a status prop: "sent" | "delivered" | "read"
- If senderName provided (group chat) and isFirstInGroup, show name above bubble in senderColor, bold, small (13px)
- Emoji-only messages (regex check): render at 2.5rem, no bubble background, no tail
- isDeleted: render italic grey text, small "no entry" icon (lucide-react Ban), "This message was deleted"
Render several sample bubbles (mix of first-in-group and consecutive) in the chat panel for visual testing against the reference screenshots.