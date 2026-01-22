'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PeerConnection,
  getLocalMediaStream,
  setAudioTrackEnabled,
  setVideoTrackEnabled,
  getAudioTrackEnabled,
  getVideoTrackEnabled,
} from '@/lib/webrtc-service';

interface UseWebRTCOptions {
  onRemoteStream?: (stream: MediaStream) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
}

export function useWebRTC(options: UseWebRTCOptions = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const peerConnectionRef = useRef<PeerConnection | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await getLocalMediaStream({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setLocalStream(stream);
        // Audio starts disabled
        setAudioTrackEnabled(stream, false);
        setIsMicEnabled(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get media stream');
        setError(error);
        if (options.onError) {
          options.onError(error);
        }
      }
    };

    initializeMedia();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new PeerConnection();

    if (options.onRemoteStream) {
      pc.onRemoteStream(options.onRemoteStream);
    }

    pc.onRemoteStream((stream) => {
      setRemoteStream(stream);
    });

    if (options.onIceCandidate) {
      pc.onIceCandidate(options.onIceCandidate);
    }

    pc.onConnectionStateChange((state) => {
      setIsConnected(state === 'connected');
      if (options.onConnectionStateChange) {
        options.onConnectionStateChange(state);
      }
    });

    peerConnectionRef.current = pc;
    return pc;
  }, [options]);

  // Add local stream to peer connection
  useEffect(() => {
    if (!localStream) return;

    const pc = initializePeerConnection();
    pc.addLocalStream(localStream);
  }, [localStream, initializePeerConnection]);

  const toggleMic = useCallback(() => {
    if (!localStream) return false;
    const enabled = !isMicEnabled;
    setAudioTrackEnabled(localStream, enabled);
    setIsMicEnabled(enabled);
    return enabled;
  }, [localStream, isMicEnabled]);

  const toggleVideo = useCallback(() => {
    if (!localStream) return false;
    const enabled = !isVideoEnabled;
    setVideoTrackEnabled(localStream, enabled);
    setIsVideoEnabled(enabled);
    return enabled;
  }, [localStream, isVideoEnabled]);

  const setMicEnabled = useCallback(
    (enabled: boolean) => {
      if (!localStream) return false;
      setAudioTrackEnabled(localStream, enabled);
      setIsMicEnabled(enabled);
      return enabled;
    },
    [localStream]
  );

  const setVideoEnabled = useCallback(
    (enabled: boolean) => {
      if (!localStream) return false;
      setVideoTrackEnabled(localStream, enabled);
      setIsVideoEnabled(enabled);
      return enabled;
    },
    [localStream]
  );

  const createOffer = useCallback(async () => {
    const pc = initializePeerConnection();
    return await pc.createOffer();
  }, [initializePeerConnection]);

  const createAnswer = useCallback(async () => {
    const pc = initializePeerConnection();
    return await pc.createAnswer();
  }, [initializePeerConnection]);

  const setRemoteDescription = useCallback(
    async (description: RTCSessionDescriptionInit) => {
      const pc = initializePeerConnection();
      await pc.setRemoteDescription(description);
    },
    [initializePeerConnection]
  );

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      const pc = initializePeerConnection();
      await pc.addIceCandidate(candidate);
    },
    [initializePeerConnection]
  );

  const close = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isConnected,
    error,
    isMicEnabled,
    isVideoEnabled,
    toggleMic,
    toggleVideo,
    setMicEnabled,
    setVideoEnabled,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    close,
    peerConnection: peerConnectionRef.current,
  };
}
