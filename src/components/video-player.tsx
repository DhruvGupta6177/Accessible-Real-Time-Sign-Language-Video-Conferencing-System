"use client";

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-lg bg-slate-900 ${isPip ? 'aspect-video' : ''}`}>
      <video ref={videoRef} muted={isMuted} autoPlay playsInline className="w-full h-full object-cover transition-opacity duration-300" />
      {!stream && (
        <Image
          src={placeholder.imageUrl}
          alt={placeholder.description}
          data-ai-hint={placeholder.imageHint}
          fill
          className="object-cover"
          priority
        />
      )}
    </div>
  );
}
