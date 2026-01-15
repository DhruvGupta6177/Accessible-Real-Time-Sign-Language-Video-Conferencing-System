'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function DashboardPage() {
  const [joinRoomId, setJoinRoomId] = useState('');
  const router = useRouter();
  const auth = useAuth();

  const handleCreateMeeting = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinMeeting = () => {
    if (joinRoomId.trim()) {
      router.push(`/room/${joinRoomId.trim()}`);
    }
  };
  
  const handleLogout = () => {
    signOut(auth);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
       <div className="absolute top-4 right-4">
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to LinguaSign</CardTitle>
          <CardDescription>Start a new meeting or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Button onClick={handleCreateMeeting} className="w-full" size="lg">
              <Video className="mr-2" />
              Create New Meeting
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter meeting link or ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="text-center"
            />
            <Button onClick={handleJoinMeeting} variant="secondary" className="w-full" disabled={!joinRoomId.trim()}>
              <LogIn className="mr-2" />
              Join Meeting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
