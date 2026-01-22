/**
 * WebRTC Service for managing peer connections and media streams
 */

export interface RTCConfig {
  iceServers: RTCIceServer[];
}

export const defaultRTCConfig: RTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export class PeerConnection {
  private peerConnection: RTCPeerConnection;
  private remoteStream: MediaStream;
  private localStream: MediaStream | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  private onConnectionStateChangeCallback?: (state: RTCPeerConnectionState) => void;
  private onTrackCallback?: (track: MediaStreamTrack) => void;

  constructor(config: RTCConfig = defaultRTCConfig) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: config.iceServers,
    });
    this.remoteStream = new MediaStream();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind, 'from streams:', event.streams.length);
      
      // Use the streams provided by the event if available
      if (event.streams && event.streams.length > 0) {
        const stream = event.streams[0];
        console.log('Using stream from event:', stream.id, 'with tracks:', stream.getTracks().length);
        this.remoteStream = stream;
      } else {
        // Fallback: add track to our remoteStream
        console.log('No streams in event, adding track to remoteStream');
        if (!this.remoteStream.getTracks().find(t => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
      }
      
      if (this.onTrackCallback) {
        this.onTrackCallback(event.track);
      }
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };
  }

  async addLocalStream(stream: MediaStream) {
    this.localStream = stream;
    stream.getTracks().forEach((track) => {
      // Check if sender already exists for this track
      const existingSender = this.peerConnection
        .getSenders()
        .find((s) => s.track === track);
      if (!existingSender) {
        this.peerConnection.addTrack(track, stream);
      }
    });
  }

  async updateLocalStream(stream: MediaStream) {
    // Remove old tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        const sender = this.peerConnection
          .getSenders()
          .find((s) => s.track === track);
        if (sender) {
          this.peerConnection.removeTrack(sender);
        }
      });
    }

    // Add new tracks
    this.localStream = stream;
    stream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, stream);
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  getRemoteStream(): MediaStream {
    return this.remoteStream;
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState;
  }

  getIceConnectionState(): RTCIceConnectionState {
    return this.peerConnection.iceConnectionState;
  }

  getPeerConnection(): RTCPeerConnection {
    return this.peerConnection;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  onTrack(callback: (track: MediaStreamTrack) => void) {
    this.onTrackCallback = callback;
  }

  close() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    this.remoteStream.getTracks().forEach((track) => track.stop());
    this.peerConnection.close();
  }
}

export async function getLocalMediaStream(
  constraints: MediaStreamConstraints = {
    video: true,
    audio: true,
  }
): Promise<MediaStream> {
  try {
    // Check if running in secure context
    if (!navigator.mediaDevices) {
      throw new Error('getUserMedia is not available. Ensure the page is served over HTTPS or localhost.');
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Provide helpful error messages
    if (errorMsg.includes('secure')) {
      console.error('Security Error: The application must be served over HTTPS (or localhost) to access camera and microphone. "Not Secure" warnings indicate you\'re using HTTP from a network address.');
      throw new Error('Camera/Microphone requires HTTPS. Use localhost:9002 instead of the network IP, or set up HTTPS with certificates.');
    }
    
    if (errorMsg.includes('NotAllowedError')) {
      console.error('Permission Denied: User did not grant camera/microphone permissions');
      throw new Error('Camera/microphone permission was denied. Please allow access in your browser settings.');
    }
    
    if (errorMsg.includes('NotFoundError')) {
      console.error('Device Not Found: No camera or microphone detected');
      throw new Error('No camera or microphone found on this device.');
    }
    
    console.error('Error getting media stream:', error);
    throw error;
  }
}

export function setAudioTrackEnabled(
  stream: MediaStream,
  enabled: boolean
): boolean {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    return false;
  }
  audioTracks[0].enabled = enabled;
  return true;
}

export function setVideoTrackEnabled(
  stream: MediaStream,
  enabled: boolean
): boolean {
  const videoTracks = stream.getVideoTracks();
  if (videoTracks.length === 0) {
    return false;
  }
  videoTracks[0].enabled = enabled;
  return true;
}

export function getAudioTrackEnabled(stream: MediaStream): boolean {
  const audioTracks = stream.getAudioTracks();
  return audioTracks.length > 0 && audioTracks[0].enabled;
}

export function getVideoTrackEnabled(stream: MediaStream): boolean {
  const videoTracks = stream.getVideoTracks();
  return videoTracks.length > 0 && videoTracks[0].enabled;
}
