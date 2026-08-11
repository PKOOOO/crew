Add a script editor panel (collapsible sidebar or separate tab) for the CURRENTLY SELECTED chat:
- A form-based UI: list of rows, each with sender dropdown, message text input, delay (ms) input, event type selector (message/typing/delete), add/remove/reorder controls
- "Play" button: resets state and replays script from index 0 for the active chat
- "Reset" button: clears visibleMessages
- Also allow editing the ChatListItem fields (name, avatar color, contact vs group) for the active chat
Keep this editor panel visually separate from the WhatsApp UI itself (e.g. a drawer that slides in from the right, or a toggle above the fold) so the WhatsApp panel stays a clean, screenshot/recording-ready UI when the editor is hidden.