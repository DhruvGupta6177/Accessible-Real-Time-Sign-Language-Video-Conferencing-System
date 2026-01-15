"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Copy, Ear, Hand, Link as LinkIcon, Mic, MicOff, PhoneOff, Send, Video as VideoIcon, VideoOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import VideoPlayer from "@/components/video-player";
import CaptionDisplay from "@/components/caption-display";
import AvatarDisplay from "@/components/avatar-display";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";
import { speechToTextCaptions } from '@/ai/flows/speech-to-text-captions';
import { signToTextTranslation } from '@/ai/flows/sign-to-text-translation';
import { textToSpeechForHearingUser } from '@/ai/flows/text-to-speech-for-hearing-user';
import { speechToSignAvatarForDeafUser } from '@/ai/flows/speech-to-sign-avatar-for-deaf-user';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type UserMode = "hearing" | "deaf";
type Caption = {
  id: number;
  text: string;
  source: "local" | "remote";
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function CallInterface() {
  const { toast } = useToast();
  const [callStarted, setCallStarted] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>("hearing");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [avatarCommands, setAvatarCommands] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [roomId, setRoomId] = useState('');
  const [roomUrl, setRoomUrl] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const localUserPlaceholder = PlaceHolderImages.find(p => p.id === 'local-user-placeholder')!;
  const remoteUserPlaceholder = PlaceHolderImages.find(p => p.id === 'remote-user-placeholder')!;
  const heroBg = PlaceHolderImages.find(p => p.id === 'hero-background')!;

  const addCaption = (text: string, source: "local" | "remote") => {
    setCaptions(prev => [...prev, { id: Date.now(), text, source }]);
  };
  
  const setLoading = (key: string, value: boolean) => setIsLoading(prev => ({...prev, [key]: value}));

  const handleStartCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      stream.getAudioTracks()[0].enabled = false;
      const newRoomId = Math.random().toString(36).substring(2, 9);
      setRoomId(newRoomId);
      setRoomUrl(`${window.location.origin}/?room=${newRoomId}`);
      setCallStarted(true);
    } catch (error) {
      console.error("Error accessing media devices.", error);
      toast({
        variant: "destructive",
        title: "Camera/Mic Error",
        description: "Could not access your camera and microphone. Please check permissions and try again.",
      });
    }
  };

  const handleStopCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setCallStarted(false);
    setCaptions([]);
    setAvatarCommands("");
    setRoomId('');
    setRoomUrl('');
  };

  const handleToggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }
  };

  const handleToggleVideo = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOn(videoTrack.enabled);
    }
  };

  const processSignToText = useCallback(async (videoBlob: Blob) => {
    if(isLoading['sign']) return;
    setLoading('sign', true);
    try {
      const dataUrl = await blobToDataUrl(videoBlob);
      const result = await signToTextTranslation({ signVideoDataUri: dataUrl });
      addCaption(result.translation, 'local');
      // Simulate remote response
      setLoading('tts', true);
      const audioResult = await textToSpeechForHearingUser({ text: result.translation });
      if(audioPlayerRef.current) {
        audioPlayerRef.current.src = audioResult.media;
        audioPlayerRef.current.play();
      }
      setLoading('tts', false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Sign Translation Error' });
    } finally {
      setLoading('sign', false);
    }
  }, [toast, isLoading]);

  const processSpeechToText = useCallback(async (audioBlob: Blob) => {
    if(isLoading['speech']) return;
    setLoading('speech', true);
    try {
      const dataUrl = await blobToDataUrl(audioBlob);
      const result = await speechToTextCaptions({ audioDataUri: dataUrl });
      addCaption(result.captions, 'local');
      // Simulate remote response
      setLoading('avatar', true);
      const avatarResult = await speechToSignAvatarForDeafUser({ spokenText: result.captions });
      setAvatarCommands(avatarResult.avatarAnimationCommands);
      setLoading('avatar', false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Speech Recognition Error' });
    } finally {
      setLoading('speech', false);
    }
  }, [toast, isLoading]);

  const handleManualSend = async () => {
    if (!manualInput.trim()) return;
    addCaption(manualInput, 'local');

    if (userMode === 'hearing') {
      setLoading('avatar', true);
      const avatarResult = await speechToSignAvatarForDeafUser({ spokenText: manualInput });
      setAvatarCommands(avatarResult.avatarAnimationCommands);
      setLoading('avatar', false);
    } else {
      setLoading('tts', true);
      const audioResult = await textToSpeechForHearingUser({ text: manualInput });
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioResult.media;
        audioPlayerRef.current.play();
      }
      setLoading('tts', false);
    }
    setManualInput("");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    toast({ title: "Link Copied!", description: "The room link has been copied to your clipboard." });
  };

  useEffect(() => {
    if (!localStream || !callStarted) {
      mediaRecorderRef.current?.stop();
      return;
    }
  
    let options: MediaRecorderOptions;
    let processData: (blob: Blob) => void;
    let timeslice: number;
  
    if (userMode === 'deaf' && isVideoOn) {
      options = { mimeType: 'video/webm; codecs=vp9' };
      processData = processSignToText;
      timeslice = 5000;
    } else if (userMode === 'hearing' && !isMicMuted) {
      options = { mimeType: 'audio/webm' };
      processData = processSpeechToText;
      timeslice = 3000;
    } else {
      mediaRecorderRef.current?.stop();
      return;
    }
  
    try {
      const recorder = new MediaRecorder(localStream, options);
      mediaRecorderRef.current = recorder;
  
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          processData(event.data);
        }
      };
  
      recorder.start(timeslice);
    } catch (e) {
      console.error("MediaRecorder error:", e);
      // Fallback for video
      if(userMode === 'deaf') {
        options = { mimeType: 'video/webm' };
        try {
          const recorder = new MediaRecorder(localStream, options);
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = event => {
            if (event.data.size > 0) processData(event.data)
          };
          recorder.start(timeslice);
        } catch(e2) {
          console.error("MediaRecorder fallback error:", e2);
          toast({variant: 'destructive', title: 'Recording Error', description: 'Your browser may not support the required recording format.'})
        }
      }
    }
  
    return () => {
      mediaRecorderRef.current?.stop();
    };
  }, [localStream, callStarted, userMode, isMicMuted, isVideoOn, processSpeechToText, processSignToText, toast]);

  if (!callStarted) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center text-center p-4">
        <Image src={heroBg.imageUrl} alt={heroBg.description} data-ai-hint={heroBg.imageHint} fill className="object-cover" />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="bg-primary/30 text-primary p-4 rounded-full">
            <Ear className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline">LinguaSign</h1>
          <p className="max-w-2xl text-lg text-foreground/80">
            Breaking barriers with real-time sign language and speech translation.
            Join a video call where everyone can be part of the conversation.
          </p>
          <Button size="lg" className="mt-4 text-lg" onClick={handleStartCall}>
            <VideoIcon className="mr-2" /> Start New Call
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground">
      <audio ref={audioPlayerRef} className="hidden" />
      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 relative flex items-center justify-center p-4">
          <VideoPlayer stream={null} placeholder={remoteUserPlaceholder} />
          <div className="absolute bottom-6 right-6 w-1/4 max-w-[250px] shadow-lg rounded-lg border-2 border-primary">
            <VideoPlayer stream={localStream} placeholder={localUserPlaceholder} isMuted isPip />
          </div>
        </div>
      </main>
      
      <Card className="w-full md:w-[400px] m-4 md:m-0 md:mr-4 md:my-4 flex flex-col rounded-xl shadow-lg">
        <CardContent className="p-4 flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <h2 className="font-headline text-2xl font-bold">LinguaSign</h2>
             <div className="flex items-center gap-2">
                <Button variant={isMicMuted ? "outline" : "default"} size="icon" onClick={handleToggleMic} disabled={userMode === 'deaf'}>
                  {isMicMuted ? <MicOff/> : <Mic/>}
                </Button>
                <Button variant={isVideoOn ? "default" : "outline"} size="icon" onClick={handleToggleVideo}>
                  {isVideoOn ? <VideoIcon/> : <VideoOff/>}
                </Button>
                <Button variant="destructive" size="icon" onClick={handleStopCall}>
                  <PhoneOff/>
                </Button>
             </div>
          </div>

          <Separator />
          
           <div className="space-y-2">
            <Label htmlFor="room-link" className="text-xs font-semibold text-muted-foreground">Share Room Link</Label>
            <div className="flex gap-2">
              <Input id="room-link" type="text" readOnly value={roomUrl} className="bg-muted/50" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Tabs value={userMode} onValueChange={(v) => setUserMode(v as UserMode)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hearing"><Ear className="mr-2"/>Hearing</TabsTrigger>
              <TabsTrigger value="deaf"><Hand className="mr-2"/>Deaf/Mute</TabsTrigger>
            </TabsList>
            <TabsContent value="hearing" className="flex-1 flex flex-col gap-4 mt-4">
              <AvatarDisplay animationCommands={avatarCommands} />
              <CaptionDisplay captions={captions} />
            </TabsContent>
            <TabsContent value="deaf" className="flex-1 flex flex-col gap-4 mt-4">
               <div className="flex-1 flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Spoken Response</h3>
                  <Card className="flex-1 flex items-center justify-center bg-muted">
                    <div className="text-center text-muted-foreground">
                      <Volume2 className="w-10 h-10 mx-auto"/>
                      <p className="text-sm mt-2">Audio from the other user will play automatically.</p>
                      {isLoading['tts'] && <p className="text-xs animate-pulse mt-1">Generating audio...</p>}
                    </div>
                  </Card>
               </div>
              <CaptionDisplay captions={captions} />
            </TabsContent>
          </Tabs>
          
          <div className="flex flex-col gap-2">
             <Textarea 
               placeholder="Or type a message..." 
               value={manualInput}
               onChange={(e) => setManualInput(e.target.value)}
               className="resize-none" 
               rows={2}
             />
             <Button onClick={handleManualSend} disabled={!manualInput.trim()}>
                <Send className="mr-2" /> Send Message
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
