import WhatsAppWeb from "@/components/WhatsAppWeb";

/** The manual WhatsApp simulator + script editor (formerly at "/"). */
export default function StudioPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <WhatsAppWeb />
    </div>
  );
}
