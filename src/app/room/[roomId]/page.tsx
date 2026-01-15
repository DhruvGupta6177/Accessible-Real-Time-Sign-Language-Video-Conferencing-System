'use client';

import { useState, useEffect, useRef } from 'react';
import CallInterface from "@/components/call-interface";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ear, Hand, Mic, Video as VideoIcon } from 'lucide-react';
import type { UserMode } from '@/components/call-interface';
import VideoPlayer from '@/components/video-player';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

function PreCallLobby({ onJoin }: { onJoin: () => void }) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const { toast } = useToast();
    const localUserPlaceholder = PlaceHolderImages.find(p => p.id === 'local-user-placeholder')!;

    useEffect(() => {
        const getMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
            } catch (error) {
                console.error("Error accessing media devices in lobby.", error);
                toast({
                  variant: "destructive",
                  title: "Media Error",
                  description: "Could not access camera/mic. Please check permissions."
                });
            }
        };
        getMedia();

        return () => {
            localStream?.getTracks().forEach(track => track.stop());
        };
    }, [toast]);
    
    const handleJoin = () => {
        localStream?.getTracks().forEach(track => track.stop());
        onJoin();
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Ready to join?</CardTitle>
                    <CardDescription>Check your camera and microphone before entering.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                        <VideoPlayer stream={localStream} placeholder={localUserPlaceholder} isMuted />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <Button size="lg" onClick={handleJoin}>Join now</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const [userMode, setUserMode] = useState<UserMode | null>(null);
  const [isInLobby, setIsInLobby] = useState(true);

  if (isInLobby) {
    return <PreCallLobby onJoin={() => setIsInLobby(false)} />;
  }

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
