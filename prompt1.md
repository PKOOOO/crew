In this Next.js (App Router) project, set up a WhatsApp Web (desktop) chat simulator.
Create:
- /types/chat.ts with:
  - ChatEvent union type:
    - { type: "message", id: string, sender: string, text: string, delay: number }
    - { type: "typing", sender: string, duration: number }
    - { type: "delete", targetId: string, delay: number }
  - A ChatListItem type: { id: string, name: string, avatarColor: string, lastMessage: string, time: string, unreadCount?: number, isGroup?: boolean }
- /lib/script-sample.ts exporting a sample ChatEvent[] for the active conversation
- /lib/chatlist-sample.ts exporting a sample ChatListItem[] for the sidebar
- /components/WhatsAppWeb.tsx as an empty client component shell (this is the top-level layout: sidebar + chat panel)
- Wire WhatsAppWeb into app/page.tsx, full viewport height/width
Use TypeScript strictly, no any types.