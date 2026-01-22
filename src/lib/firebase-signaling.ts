'use client';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { Auth } from 'firebase/auth';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
  timestamp: Timestamp;
}

export class FirebaseSignalingService {
  private firestore: Firestore;
  private auth: Auth;
  private roomId: string;
  private userId: string;
  private unsubscribers: (() => void)[] = [];

  constructor(roomId: string, firestore: Firestore, auth: Auth, userId: string) {
    console.log('[FirebaseSignaling] Initializing with userId:', userId);
    // Accept userId as-is, even if it might be empty initially
    this.firestore = firestore;
    this.auth = auth;
    this.roomId = roomId;
    this.userId = userId;
    console.log('[FirebaseSignaling] Initialized successfully with roomId:', roomId);
  }

  /**
   * Send an offer to another peer
   */
  async sendOffer(offer: RTCSessionDescriptionInit, recipientId: string) {
    const messageId = `${this.userId}-${Date.now()}-offer`;
    const messageRef = doc(
      this.firestore,
      `rooms/${this.roomId}/messages/${messageId}`
    );

    await setDoc(messageRef, {
      type: 'offer',
      from: this.userId,
      to: recipientId,
      data: offer,
      timestamp: Timestamp.now(),
    });
  }

  /**
   * Send an answer to another peer
   */
  async sendAnswer(answer: RTCSessionDescriptionInit, recipientId: string) {
    const messageId = `${this.userId}-${Date.now()}-answer`;
    const messageRef = doc(
      this.firestore,
      `rooms/${this.roomId}/messages/${messageId}`
    );

    await setDoc(messageRef, {
      type: 'answer',
      from: this.userId,
      to: recipientId,
      data: answer,
      timestamp: Timestamp.now(),
    });
  }

  /**
   * Send an ICE candidate
   */
  async sendIceCandidate(
    candidate: RTCIceCandidate,
    recipientId: string
  ) {
    const messageId = `${this.userId}-${Date.now()}-ice`;
    const messageRef = doc(
      this.firestore,
      `rooms/${this.roomId}/messages/${messageId}`
    );

    await setDoc(messageRef, {
      type: 'ice-candidate',
      from: this.userId,
      to: recipientId,
      data: {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
      },
      timestamp: Timestamp.now(),
    });
  }

  /**
   * Listen for incoming messages
   */
  onMessage(
    callback: (message: SignalingMessage) => void
  ): () => void {
    const messagesRef = collection(
      this.firestore,
      `rooms/${this.roomId}/messages`
    );

    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as SignalingMessage;
            if (data.to === this.userId) {
              callback(data);
              // Delete the message after reading
              deleteDoc(change.doc.ref).catch((err) =>
                console.error('Error deleting message:', err)
              );
            }
          }
        });
      },
      (error) => {
        console.error('[FirebaseSignaling] Message listener error:', error);
      }
    );

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Register user presence in the room
   */
  async registerPresence(displayName?: string) {
    try {
      const presenceRef = doc(
        this.firestore,
        `rooms/${this.roomId}/participants/${this.userId}`
      );

      const presenceData = {
        userId: this.userId,
        displayName: displayName || 'Unknown',
        joinedAt: Timestamp.now(),
        status: 'online',
      };

      console.log('[FirebaseSignaling] ===== REGISTERING PRESENCE =====');
      console.log('[FirebaseSignaling] Path:', `rooms/${this.roomId}/participants/${this.userId}`);
      console.log('[FirebaseSignaling] Data to write:', presenceData);
      console.log('[FirebaseSignaling] Firestore instance:', !!this.firestore);
      
      await setDoc(presenceRef, presenceData);
      
      console.log('[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====');
      return true;
    } catch (error) {
      console.error('[FirebaseSignaling] ===== ERROR REGISTERING PRESENCE =====');
      console.error('[FirebaseSignaling] Error details:', error);
      // Don't throw - just log and continue
      return false;
    }
  }

  /**
   * Listen for other participants in the room
   */
  onParticipantsChange(
    callback: (participants: Array<{ id: string; displayName: string }>) => void
  ): () => void {
    const participantsRef = collection(
      this.firestore,
      `rooms/${this.roomId}/participants`
    );

    console.log('[FirebaseSignaling] ===== SETTING UP PARTICIPANTS LISTENER =====');
    console.log('[FirebaseSignaling] Path:', `rooms/${this.roomId}/participants`);
    console.log('[FirebaseSignaling] Current user ID:', this.userId);

    const unsubscribe = onSnapshot(
      participantsRef,
      (snapshot) => {
        console.log('[FirebaseSignaling] ===== PARTICIPANTS SNAPSHOT RECEIVED =====');
        console.log('[FirebaseSignaling] Total documents:', snapshot.docs.length);
        console.log('[FirebaseSignaling] All documents:');
        snapshot.docs.forEach(doc => {
          console.log('[FirebaseSignaling]   -', doc.id, ':', doc.data());
        });

        const participants = snapshot.docs
          .filter((doc) => {
            const shouldInclude = doc.id !== this.userId;
            console.log(`[FirebaseSignaling] Document ${doc.id}: shouldInclude=${shouldInclude} (filtered=${doc.id === this.userId})`);
            return shouldInclude;
          })
          .map((doc) => {
            const data = doc.data();
            const participant = {
              id: doc.id,
              displayName: data.displayName || 'Unknown',
            };
            console.log('[FirebaseSignaling] Mapped participant:', participant);
            return participant;
          });

        console.log('[FirebaseSignaling] Final participants list to callback:', participants);
        callback(participants);
      },
      (error) => {
        console.error('[FirebaseSignaling] ===== ERROR IN PARTICIPANTS LISTENER =====');
        console.error('[FirebaseSignaling] Error details:', error);
        // Call with empty array on error
        callback([]);
      }
    );

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Remove user presence from the room
   */
  async removePresence() {
    const presenceRef = doc(
      this.firestore,
      `rooms/${this.roomId}/participants/${this.userId}`
    );

    try {
      await deleteDoc(presenceRef);
    } catch (error) {
      console.error('Error removing presence:', error);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }
}
