import CallInterface from "@/components/call-interface";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <main className="bg-background min-h-screen">
      <CallInterface roomId={params.roomId} />
    </main>
  );
}
