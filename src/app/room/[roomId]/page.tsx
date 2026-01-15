'use client';

import { useState } from 'react';
import CallInterface from "@/components/call-interface";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ear, Hand } from 'lucide-react';
import type { UserMode } from '@/components/call-interface';

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const [userMode, setUserMode] = useState<UserMode | null>(null);

  if (!userMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Experience</CardTitle>
            <CardDescription>Select how you will participate in this call.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-24 text-lg flex-col gap-2"
              onClick={() => setUserMode('hearing')}
            >
              <Ear className="w-8 h-8" />
              Hearing
            </Button>
            <Button
              variant="outline"
              className="h-24 text-lg flex-col gap-2"
              onClick={() => setUserMode('deaf')}
            >
              <Hand className="w-8 h-8" />
              Deaf/Mute
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <main className="bg-background min-h-screen">
      <CallInterface roomId={params.roomId} initialUserMode={userMode} />
    </main>
  );
}
