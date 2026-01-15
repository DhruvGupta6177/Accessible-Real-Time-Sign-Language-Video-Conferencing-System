'use client';

import { useState, useEffect, useRef } from 'react';
import CallInterface from "@/components/call-interface";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ear, Hand } from 'lucide-react';
import type { UserMode } from '@/components/call-interface';
import VideoPlayer from '@/components/video-player';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    }, [toast, localStream]);
    
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
  const [displayName, setDisplayName] = useState('');
  const [isInLobby, setIsInLobby] = useState(true);
  const { toast } = useToast();

  const handleModeSelection = (mode: UserMode) => {
    if (!displayName.trim()) {
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Please enter your name to join the meeting."
      });
      return;
    }
    setUserMode(mode);
  };

  if (isInLobby) {
    return <PreCallLobby onJoin={() => setIsInLobby(false)} />;
  }

  if (!userMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Experience</CardTitle>
            <CardDescription>Select how you will participate and enter your name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="display-name">Your Name</Label>
                <Input 
                    id="display-name" 
                    placeholder="Enter your name" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 text-lg flex-col gap-2"
                  onClick={() => handleModeSelection('hearing')}
                >
                  <Ear className="w-8 h-8" />
                  Hearing
                </Button>
                <Button
                  variant="outline"
                  className="h-24 text-lg flex-col gap-2"
                  onClick={() => handleModeSelection('deaf')}
                >
                  <Hand className="w-8 h-8" />
                  Deaf/Mute
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <main className="bg-background min-h-screen">
      <CallInterface roomId={params.roomId} initialUserMode={userMode} displayName={displayName} />
    </main>
  );
}
