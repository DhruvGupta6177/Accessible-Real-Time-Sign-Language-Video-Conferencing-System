"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface VideoPlayerProps {
  stream?: MediaStream | null;
  placeholder: ImagePlaceholder;
  isMuted?: boolean;
  isPip?: boolean;
}

export default function VideoPlayer({ stream, placeholder, isMuted = false, isPip = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStream, setHasStream] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      console.log('[VideoPlayer] Setting stream:', {
        streamId: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });
      video.srcObject = stream;
      setHasStream(true);
      
      // Ensure video plays
      video.play().catch(err => {
        console.error('[VideoPlayer] Error playing video:', err);
      });
    } else {
      console.log('[VideoPlayer] No stream available');
      video.srcObject = null;
      setHasStream(false);
    }
  }, [stream]);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-lg bg-slate-900 ${isPip ? 'aspect-video' : ''}`}>
      <video 
        ref={videoRef} 
        muted={isMuted} 
        autoPlay 
        playsInline 
        className={`w-full h-full object-cover transition-opacity duration-300 ${hasStream ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
      />
      {!hasStream && (
        <Image
          src={placeholder.imageUrl}
          alt={placeholder.description}
          data-ai-hint={placeholder.imageHint}
          fill
          className="object-cover absolute inset-0 z-0"
          priority
        />
      )}
    </div>
  );
}
