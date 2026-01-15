"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Ear, Hand, Link as LinkIcon, Mic, MicOff, PhoneOff, Send, Share2, PanelRightOpen, PanelRightClose, Video as VideoIcon, VideoOff, Volume2, CircleDot, Users, User, ChevronDown, ChevronUp, Search, ScreenShare, ScreenShareOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ShareDialog from "./share-dialog";
import { useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

export type UserMode = "hearing" | "deaf";
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

export default function CallInterface({ roomId, initialUserMode }: { roomId: string, initialUserMode: UserMode }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const [userMode, setUserMode] = useState<UserMode>(initialUserMode);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [avatarCommands, setAvatarCommands] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [roomUrl, setRoomUrl] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [participantSearch, setParticipantSearch] = useState("");


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const localUserPlaceholder = PlaceHolderImages.find(p => p.id === 'local-user-placeholder')!;
  const remoteUserPlaceholder = PlaceHolderImages.find(p => p.id === 'remote-user-placeholder')!;
  const userAvatarPlaceholder = PlaceHolderImages.find(p => p.id === 'user-avatar-placeholder');

  const participants = [
    { name: user?.email || 'You', isMe: true },
    { name: 'Remote User', isMe: false }
  ];

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const addCaption = (text: string, source: "local" | "remote") => {
    setCaptions(prev => [...prev, { id: Date.now(), text, source }]);
  };
  
  const setLoading = (key: string, value: boolean) => setIsLoading(prev => ({...prev, [key]: value}));

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        stream.getAudioTracks()[0].enabled = false;
        setRoomUrl(`${window.location.origin}/room/${roomId}`);
      } catch (error) {
        console.error("Error accessing media devices.", error);
        toast({
          variant: "destructive",
          title: "Camera/Mic Error",
          description: "Could not access your camera and microphone. Please check permissions and try again.",
        });
      }
    };
    startCall();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
    }
  }, [roomId, toast]);


  const handleStopCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    screenStream?.getTracks().forEach(track => track.stop());
    setLocalStream(null);
    setScreenStream(null);
    setCaptions([]);
    setAvatarCommands("");
    router.push('/dashboard');
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

  const handleToggleRecording = () => {
    setIsRecording(prev => !prev);
    toast({
        title: isRecording ? "Recording Stopped" : "Recording Started",
        description: isRecording ? "The meeting recording has been stopped." : "The meeting is now being recorded."
    })
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => {
            setScreenStream(null);
            setIsScreenSharing(false);
        };
      } catch (error) {
        console.error("Error starting screen share", error);
        toast({ variant: 'destructive', title: 'Screen Share Error', description: 'Could not start screen sharing.' });
      }
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
      console.error(e);
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
      console.error(e);
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

  useEffect(() => {
    const streamForRecorder = isScreenSharing ? screenStream : localStream;
    if (!streamForRecorder) {
      mediaRecorderRef.current?.stop();
      return;
    }
  
    let options: MediaRecorderOptions;
    let processData: (blob: Blob) => void;
    let timeslice: number;
  
    if (userMode === 'deaf' && isVideoOn && !isScreenSharing) {
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
      const recorder = new MediaRecorder(streamForRecorder, options);
      mediaRecorderRef.current = recorder;
  
      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          processData(event.data);
        }
      };
  
      recorder.start(timeslice);
    } catch (e) {
      console.error("MediaRecorder error:", e);
      if(userMode === 'deaf') {
        options = { mimeType: 'video/webm' };
        try {
          const recorder = new MediaRecorder(streamForRecorder, options);
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
  }, [localStream, screenStream, isScreenSharing, userMode, isMicMuted, isVideoOn, processSpeechToText, processSignToText, toast]);

  const mainViewStream = isScreenSharing ? screenStream : null;
  const pipStream = isScreenSharing ? localStream : localStream;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <audio ref={audioPlayerRef} className="hidden" />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute top-4 left-4 z-20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{textShadow: '0 0 8px rgba(0,0,0,0.7)'}}>
            <Ear className="w-6 h-6" />
            LinguaSign
          </h2>
        </div>
        <div className="flex-1 relative flex items-center justify-center p-4 bg-black">
          <VideoPlayer stream={mainViewStream} placeholder={isScreenSharing ? { ...remoteUserPlaceholder, description: "Your screen share"} : remoteUserPlaceholder} />
          <div className="absolute bottom-24 md:bottom-6 right-6 w-1/4 max-w-[250px] min-w-[150px] shadow-lg rounded-lg border-2 border-primary z-20">
            <VideoPlayer stream={pipStream} placeholder={localUserPlaceholder} isMuted isPip />
          </div>
          {isRecording && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-destructive/80 text-destructive-foreground px-3 py-1 rounded-md">
                  <CircleDot className="w-4 h-4 animate-pulse" />
                  <span>REC</span>
              </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center p-4">
          <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm p-3 rounded-xl shadow-lg">
             <Button variant={isMicMuted ? "outline" : "default"} size="icon" className="w-12 h-12 rounded-full" onClick={handleToggleMic} disabled={userMode === 'deaf'}>
                {isMicMuted ? <MicOff/> : <Mic/>}
              </Button>
              <Button variant={isVideoOn ? "default" : "outline"} size="icon" className="w-12 h-12 rounded-full" onClick={handleToggleVideo}>
                {isVideoOn ? <VideoIcon/> : <VideoOff/>}
              </Button>
               <Button variant={isScreenSharing ? "default" : "outline"} size="icon" className="w-12 h-12 rounded-full" onClick={handleToggleScreenShare}>
                {isScreenSharing ? <ScreenShareOff /> : <ScreenShare />}
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={handleToggleRecording}>
                <CircleDot className={cn(isRecording && "text-destructive")}/>
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <Button variant="destructive" size="icon" className="w-14 h-12 rounded-full" onClick={handleStopCall}>
                <PhoneOff/>
              </Button>
              <Separator orientation="vertical" className="h-8" />
               <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
              </Button>
          </div>
        </div>
      </main>
      
      <div className={cn("flex flex-col transition-all duration-300 ease-in-out", isSidebarOpen ? "w-full max-w-sm" : "w-0")}>
        <Card className={cn("m-2 flex-1 flex flex-col rounded-xl shadow-lg overflow-hidden transition-opacity duration-300", isSidebarOpen ? "opacity-100" : "opacity-0")}>
          <CardContent className="p-4 flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
                    {userMode === 'hearing' ? <Ear /> : <Hand />}
                    You are in {userMode === 'hearing' ? 'Hearing' : 'Deaf/Mute'} Mode
                </div>
                <ShareDialog roomUrl={roomUrl}>
                    <Button variant="outline" size="sm">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                </ShareDialog>
            </div>
            
            <Separator />

             <Collapsible open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
                <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4"/>Participants ({participants.length})</h3>
                        {isParticipantsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search participants..." 
                            value={participantSearch}
                            onChange={(e) => setParticipantSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {filteredParticipants.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                <Avatar className="h-8 w-8">
                                    {userAvatarPlaceholder && <AvatarImage src={p.isMe ? localUserPlaceholder.imageUrl : remoteUserPlaceholder.imageUrl} alt={p.name} />}
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm truncate">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
             </Collapsible>

            <Separator />
            
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              {userMode === 'hearing' ? (
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <AvatarDisplay animationCommands={avatarCommands} />
                    <CaptionDisplay captions={captions} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Spoken Response</h3>
                        <Card className="flex-1 flex items-center justify-center bg-muted">
                          <div className="text-center text-muted-foreground p-4">
                            <Volume2 className="w-10 h-10 mx-auto"/>
                            <p className="text-sm mt-2">Audio from the other user will play here.</p>
                            {isLoading['tts'] && <p className="text-xs animate-pulse mt-1">Generating audio...</p>}
                          </div>
                        </Card>
                    </div>
                    <CaptionDisplay captions={captions} />
                  </div>
                )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Textarea 
                placeholder="Or type a message..." 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="resize-none" 
                rows={2}
              />
              <Button onClick={handleManualSend} disabled={!manualInput.trim()}>
                  <Send className="mr-2" /> Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
