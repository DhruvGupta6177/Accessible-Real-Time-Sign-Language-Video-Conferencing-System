'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth, useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection } from 'firebase/firestore';
import { useMeetings } from '@/hooks/use-meetings';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardPage() {
  const [joinRoomId, setJoinRoomId] = useState('');
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const { meetings, isLoading } = useMeetings();

  const handleCreateMeeting = async () => {
    if (!user) return;
    
    const newRoomId = Math.random().toString(36).substring(2, 9);
    const meetingsColRef = collection(firestore, 'users', user.uid, 'meetings');
    
    const meetingData = {
      hostId: user.uid,
      id: newRoomId,
      inviteLink: `${window.location.origin}/room/${newRoomId}`,
      startTime: new Date().toISOString(),
    };
    
    await addDocumentNonBlocking(meetingsColRef, meetingData);
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
       <div className="absolute top-4 right-4 flex items-center gap-4">
        <ThemeToggle />
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-4xl">
        <Card className="w-full lg:w-1/3">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">New Meeting</CardTitle>
            <CardDescription>Start or join a video call.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Button onClick={handleCreateMeeting} className="w-full" size="lg">
                <Plus className="mr-2" />
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

        <Card className="w-full lg:w-2/3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Review your past meetings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Meeting History</AccordionTrigger>
                <AccordionContent>
                  {isLoading && <p>Loading meetings...</p>}
                  {!isLoading && (!meetings || meetings.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                      <Video className="mx-auto h-12 w-12" />
                      <p className="mt-4">You haven&apos;t created any meetings yet.</p>
                    </div>
                  )}
                  {!isLoading && meetings && meetings.length > 0 && (
                    <ul className="space-y-3 pt-4">
                      {meetings.map((meeting) => (
                        <li key={meeting.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex flex-col">
                            <span className="font-semibold">Room ID: {meeting.id}</span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(meeting.startTime), "PPP p")}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/room/${meeting.id}`)}>
                            Rejoin
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
