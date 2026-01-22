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
import { useUser, useFirebase } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useWebRTC } from "@/hooks/use-webrtc";
import { FirebaseSignalingService } from "@/lib/firebase-signaling";
import { PeerConnection } from "@/lib/webrtc-service";

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

export default function CallInterface({ roomId, initialUserMode, displayName }: { roomId: string, initialUserMode: UserMode, displayName: string }) {
  const { toast } = useToast();
  const router = useRouter();
  
  // Get Firebase services - these should always be available in the CallInterface
  const { user, firestore, auth } = useFirebase();
  const [userMode, setUserMode] = useState<UserMode>(initialUserMode);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [avatarCommands, setAvatarCommands] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [roomUrl, setRoomUrl] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
  const [participantSearch, setParticipantSearch] = useState("");
  const [remoteParticipants, setRemoteParticipants] = useState<Array<{ id: string; displayName: string }>>([]);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | 'not-connected'>('not-connected');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const signalingRef = useRef<FirebaseSignalingService | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // Initialize WebRTC
  const {
    localStream,
    remoteStream,
    isConnected,
    isMicEnabled,
    isVideoEnabled,
    toggleMic,
    toggleVideo,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    close: closeWebRTC,
  } = useWebRTC({
    onConnectionStateChange: (state) => setConnectionState(state),
    onError: (error) => {
      console.error('WebRTC Error:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error.message,
      });
    },
  });

  const localUserPlaceholder = PlaceHolderImages.find(p => p.id === 'local-user-placeholder')!;
  const remoteUserPlaceholder = PlaceHolderImages.find(p => p.id === 'remote-user-placeholder')!;
  const userAvatarPlaceholder = PlaceHolderImages.find(p => p.id === 'user-avatar-placeholder');

  const participants = [
    { name: displayName || user?.email || 'You', isMe: true, id: user?.uid || 'local' },
    ...remoteParticipants.map(p => ({ name: p.displayName, isMe: false, id: p.id }))
  ];

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const addCaption = (text: string, source: "local" | "remote") => {
    setCaptions(prev => [...prev, { id: Date.now(), text, source }]);
  };
  
  const setLoading = (key: string, value: boolean) => setIsLoading(prev => ({...prev, [key]: value}));

  // Initialize signaling and setup WebRTC connection
  useEffect(() => {
    console.log('[CallInterface] Initialization dependencies:', {
      user: user?.uid,
      roomId,
      firestore: firestore ? 'available' : 'null',
      auth: auth ? 'available' : 'null',
    });

    // Don't initialize if user is not authenticated
    if (!user) {
      console.log('[CallInterface] User not authenticated yet');
      return;
    }

    if (!roomId || !firestore || !auth) {
      console.log('[CallInterface] Skipping initialization - missing dependencies');
      return;
    }

    const initializeSignaling = async () => {
      try {
        console.log('[CallInterface] Starting signaling initialization');
        console.log('[CallInterface] Creating FirebaseSignalingService with:', {
          roomId,
          userId: user.uid,
          hasFirestore: !!firestore,
          hasAuth: !!auth,
        });

        signalingRef.current = new FirebaseSignalingService(roomId, firestore, auth, user.uid);
        
        // Register presence with display name
        console.log('[CallInterface] Registering presence with name:', displayName);
        const presenceSuccess = await signalingRef.current.registerPresence(displayName);
        console.log('[CallInterface] Presence registered:', presenceSuccess);

        // Listen for remote participants
        signalingRef.current.onParticipantsChange((participants) => {
          console.log('[CallInterface] Participants changed:', participants);
          setRemoteParticipants(participants);
          
          // Create peer connection for each new participant
          participants.forEach((participant) => {
            if (!peerConnectionsRef.current.has(participant.id)) {
              console.log('[CallInterface] Creating peer connection for:', participant.id, participant.displayName);
              console.log('[CallInterface] Local stream available:', !!localStream);
              
              try {
                // Create new peer connection
                const pc = new PeerConnection();
                
                // Add local stream to peer connection
                if (localStream) {
                  console.log('[CallInterface] Adding local stream to peer connection for:', participant.id);
                  pc.addLocalStream(localStream);
                } else {
                  console.warn('[CallInterface] No local stream available for:', participant.id);
                }
                
                // Handle remote stream
                pc.onRemoteStream((stream) => {
                  console.log('[CallInterface] Remote stream received from:', participant.id);
                  console.log('[CallInterface] Remote stream details:', {
                    videoTracks: stream.getVideoTracks().length,
                    audioTracks: stream.getAudioTracks().length,
                    totalTracks: stream.getTracks().length,
                    streamId: stream.id,
                  });
                  stream.getTracks().forEach(track => {
                    console.log('[CallInterface] Track:', { kind: track.kind, enabled: track.enabled, id: track.id });
                  });
                  remoteStreamsRef.current.set(participant.id, stream);
                  setRemoteStreams(new Map(remoteStreamsRef.current));
                });
                
                // Handle ICE candidates
                pc.onIceCandidate((candidate) => {
                  console.log('[CallInterface] Sending ICE candidate to:', participant.id);
                  signalingRef.current?.sendIceCandidate(candidate, participant.id);
                });
                
                peerConnectionsRef.current.set(participant.id, pc);
                
                // Create and send offer
                pc.createOffer().then(offer => {
                  console.log('[CallInterface] Created offer for:', participant.id);
                  signalingRef.current?.sendOffer(offer, participant.id);
                }).catch(err => {
                  console.error('Error creating offer for', participant.id, ':', err);
                });
              } catch (error) {
                console.error('Error creating peer connection for', participant.id, ':', error);
              }
            }
          });
        });

        // Listen for signaling messages
        signalingRef.current.onMessage(async (message) => {
          console.log('[CallInterface] Received signaling message:', message.type, 'from:', message.from);
          
          try {
            if (!message.data) {
              console.warn('[CallInterface] Received message with no data:', message);
              return;
            }
            
            // Get or create peer connection for this user
            let pc = peerConnectionsRef.current.get(message.from);
            if (!pc) {
              console.log('[CallInterface] Creating peer connection for incoming message from:', message.from);
              pc = new PeerConnection();
              
              // Add local stream
              if (localStream) {
                console.log('[CallInterface] Adding local stream to incoming peer connection from:', message.from);
                pc.addLocalStream(localStream);
              } else {
                console.warn('[CallInterface] No local stream when creating peer connection for:', message.from);
              }
              
              // Handle remote stream
              pc.onRemoteStream((stream) => {
                console.log('[CallInterface] Remote stream received from:', message.from);
                console.log('[CallInterface] Remote stream video tracks:', stream.getVideoTracks().length);
                console.log('[CallInterface] Remote stream audio tracks:', stream.getAudioTracks().length);
                console.log('[CallInterface] Stream details:', {
                  streamId: stream.id,
                  totalTracks: stream.getTracks().length,
                });
                remoteStreamsRef.current.set(message.from, stream);
                setRemoteStreams(new Map(remoteStreamsRef.current));
              });
              
              // Handle ICE candidates
              pc.onIceCandidate((candidate) => {
                console.log('[CallInterface] Sending ICE candidate to:', message.from);
                signalingRef.current?.sendIceCandidate(candidate, message.from);
              });
              
              peerConnectionsRef.current.set(message.from, pc);
            }
            
            if (message.type === 'offer') {
              console.log('[CallInterface] Processing offer from:', message.from);
              // Only set remote description if signaling state allows it
              if (pc.peerConnection.signalingState === 'stable') {
                await pc.setRemoteDescription(message.data);
                const answer = await pc.createAnswer();
                await signalingRef.current!.sendAnswer(answer, message.from);
              } else {
                console.warn('[CallInterface] Peer connection not in stable state for offer:', pc.peerConnection.signalingState);
              }
            } else if (message.type === 'answer') {
              console.log('[CallInterface] Processing answer from:', message.from);
              console.log('[CallInterface] Current signaling state:', pc.peerConnection.signalingState);
              // Only set remote description if in have-local-offer state
              if (pc.peerConnection.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(message.data);
              } else {
                console.warn('[CallInterface] Cannot set remote answer in state:', pc.peerConnection.signalingState);
              }
            } else if (message.type === 'ice-candidate') {
              console.log('[CallInterface] Adding ICE candidate from:', message.from);
              // Only add ICE candidate if peer connection is not closed
              if (pc.peerConnection.connectionState !== 'closed') {
                await pc.addIceCandidate(message.data).catch((err) => {
                  console.warn('[CallInterface] Error adding ICE candidate:', err);
                });
              }
            }
          } catch (error) {
            console.error('Error processing signaling message:', error);
          }
        });

        // Setup room URL
        try {
          let origin = window.location.origin;
          if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.')) {
            const res = await fetch('/api/server-ip');
            if (res.ok) {
              const data = await res.json();
              const serverIp = data?.ip;
              if (serverIp && serverIp !== 'localhost') {
                origin = `${window.location.protocol}//${serverIp}:${window.location.port}`;
              }
            }
          }
          setRoomUrl(`${origin}/room/${roomId}`);
        } catch (e) {
          setRoomUrl(`${window.location.origin}/room/${roomId}`);
        }

        toast({
          title: "Connected",
          description: "You are now connected to the room."
        });
      } catch (error) {
        console.error("[CallInterface] Error initializing signaling:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[CallInterface] Error details:", {
          message: errorMessage,
          type: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined,
        });
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: `Could not connect to the room. ${errorMessage}`,
        });
      }
    };

    initializeSignaling();

    return () => {
      signalingRef.current?.removePresence().catch(console.error);
      signalingRef.current?.cleanup();
    };
  }, [user, roomId, firestore, auth, displayName, toast]);

  // Add local stream to all existing peer connections when it becomes available
  useEffect(() => {
    if (!localStream || peerConnectionsRef.current.size === 0) return;

    console.log('[CallInterface] Local stream became available, updating peer connections');
    peerConnectionsRef.current.forEach((pc, participantId) => {
      try {
        console.log('[CallInterface] Adding local stream to peer connection:', participantId);
        pc.addLocalStream(localStream);
      } catch (error) {
        console.error('[CallInterface] Error adding local stream to peer connection:', participantId, error);
      }
    });
  }, [localStream]);

  const handleStopCall = async () => {
    closeWebRTC();
    screenStream?.getTracks().forEach(track => track.stop());
    setScreenStream(null);
    setCaptions([]);
    setAvatarCommands("");
    
    if (signalingRef.current) {
      await signalingRef.current.removePresence();
      signalingRef.current.cleanup();
    }

    peerConnectionsRef.current.forEach(pc => pc?.close?.());
    peerConnectionsRef.current.clear();

    router.push('/dashboard');
  };

  const handleToggleMic = useCallback(() => {
    toggleMic();
  }, [toggleMic]);

  const handleToggleVideo = useCallback(() => {
    toggleVideo();
  }, [toggleVideo]);

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
  
    if (userMode === 'deaf' && isVideoEnabled && !isScreenSharing) {
      options = { mimeType: 'video/webm; codecs=vp9' };
      processData = processSignToText;
      timeslice = 5000;
    } else if (userMode === 'hearing' && isMicEnabled) {
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
  }, [localStream, screenStream, isScreenSharing, userMode, isMicEnabled, isVideoEnabled, processSpeechToText, processSignToText, toast]);

  // Get first remote stream for main view
  const getMainRemoteStream = () => {
    console.log('[CallInterface] getMainRemoteStream - checking remote streams:', remoteStreams.size);
    if (remoteStreams.size > 0) {
      const stream = remoteStreams.values().next().value as MediaStream;
      console.log('[CallInterface] Found remote stream:', {
        streamId: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        totalTracks: stream.getTracks().length,
      });
      // Verify stream has tracks before returning
      if (stream.getTracks().length > 0) {
        console.log('[CallInterface] Using remote stream with', stream.getTracks().length, 'tracks');
        return stream;
      } else {
        console.warn('[CallInterface] Remote stream has no tracks');
      }
    } else {
      console.log('[CallInterface] No remote streams available');
    }
    return null;
  };

  const mainViewStream = isScreenSharing ? screenStream : getMainRemoteStream();
  const pipStream = isScreenSharing ? localStream : localStream;
  
  console.log('[CallInterface] Render state:', {
    isScreenSharing,
    mainViewStream: mainViewStream ? 'has stream' : 'null',
    pipStream: pipStream ? 'has stream' : 'null',
    remoteStreamsCount: remoteStreams.size,
  });
  
  // Debug logging
  useEffect(() => {
    console.log('[CallInterface] Remote streams count:', remoteStreams.size);
    remoteStreams.forEach((stream, participantId) => {
      console.log(`[CallInterface] Stream from ${participantId}:`, {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        totalTracks: stream.getTracks().length,
      });
    });
  }, [remoteStreams]);

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
          {connectionState !== 'connected' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-yellow-500/80 text-yellow-950 px-3 py-1 rounded-md">
                  <CircleDot className="w-4 h-4 animate-pulse" />
                  <span>Connecting...</span>
              </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center p-4">
          <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm p-3 rounded-xl shadow-lg">
             <Button variant={!isMicEnabled ? "outline" : "default"} size="icon" className="w-12 h-12 rounded-full" onClick={handleToggleMic} disabled={userMode === 'deaf'}>
                {!isMicEnabled ? <MicOff/> : <Mic/>}
              </Button>
              <Button variant={isVideoEnabled ? "default" : "outline"} size="icon" className="w-12 h-12 rounded-full" onClick={handleToggleVideo}>
                {isVideoEnabled ? <VideoIcon/> : <VideoOff/>}
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
