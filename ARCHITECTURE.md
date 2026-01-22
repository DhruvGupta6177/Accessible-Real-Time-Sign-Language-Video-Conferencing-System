# 🏗️ System Architecture & How Two Users Connect

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME SIGN LANGUAGE APP                      │
└─────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │  Firestore   │
                         │  (Firebase)  │
                         └──────────────┘
                              │ │ │
               ┌──────────────┘ │ └──────────────┐
               │                │                │
        ┌──────▼───────┐   ┌────▼─────┐   ┌─────▼──────┐
        │ /rooms/{id}/ │   │  /users/  │   │  /other    │
        │ participants │   │           │   │  collections
        │              │   │           │   │
        │ User1: {     │   │ User1: {} │   │
        │  displayName │   │ User2: {} │   │
        │  "User1",    │   │           │   │
        │  status...   │   │           │   │
        │ }            │   │           │   │
        │              │   │           │   │
        │ User2: {     │   │           │   │
        │  displayName │   │           │   │
        │  "User2",    │   │           │   │
        │  status...   │   │           │   │
        │ }            │   │           │   │
        └──────────────┘   └───────────┘   └───────────┘
               ▲                                    ▲
               │         SIGNALING MESSAGES         │
               │    /rooms/{id}/messages/          │
               │  (offers, answers, ICE)           │
               │                                   │
        ┌──────┴────────────────────────┬──────────┴─────┐
        │                               │                │
   ┌────▼──────┐                   ┌────▼──────┐       │
   │ Computer1 │                   │ Computer2 │       │
   │           │                   │           │       │
   │┌─────────┐│                   │┌─────────┐│  WebRTC
   ││ Browser ││  ────Offer───────▶││ Browser ││  Direct P2P
   ││ User1   ││◀────Answer────────││ User2   ││  (video/audio)
   ││         ││  ◀ICE Candidates──▶││         ││
   │└─────────┘│  (Network Finding) │└─────────┘│
   │           │                   │           │
   │ Camera    │◀────────VIDEO──────▶ Camera    │
   │ Microphone│◀────────AUDIO──────▶ Microphone│
   │           │                   │           │
   └───────────┘                   └───────────┘
```

---

## Connection Flow (Step by Step)

### STEP 1: User1 Joins Meeting
```
User1 Browser
    ↓
    ├─→ Sign Up (Firebase Auth)
    │   Creates user account
    ├─→ Create Meeting 
    │   Gets unique Room ID
    ├─→ Enter Display Name: "User1"
    └─→ Click "Join Now"
         ├─→ Get camera/microphone
         ├─→ Save presence to Firestore:
         │   /rooms/{roomId}/participants/{user1Id}
         │   {
         │     userId: "user1Id",
         │     displayName: "User1",  ← NAME SAVED HERE
         │     joinedAt: timestamp,
         │     status: "online"
         │   }
         ├─→ Start listening for changes to:
         │   /rooms/{roomId}/participants
         │   (waiting for other users to join)
         └─→ See self in main video
             (Local stream from useWebRTC hook)
```

### STEP 2: User2 Joins Same Meeting
```
User2 Browser
    ↓
    ├─→ Sign Up (Firebase Auth)
    │   Creates user account
    ├─→ Find User1's Meeting
    ├─→ Enter Display Name: "User2"
    └─→ Click "Join Now"
         ├─→ Get camera/microphone
         ├─→ Save presence to Firestore:
         │   /rooms/{roomId}/participants/{user2Id}
         │   {
         │     userId: "user2Id",
         │     displayName: "User2",  ← NAME SAVED HERE
         │     joinedAt: timestamp,
         │     status: "online"
         │   }
         └─→ Start listening for other participants
```

### STEP 3: User1 Detects User2
```
Firestore Listener (on User1's browser)
    ↓
    Detects new document in participants collection
    ↓
    Calls callback with all participants:
    [
      { id: "user2Id", displayName: "User2" }
    ]
    ↓
User1's Call Interface Component
    ├─→ Updates state: setRemoteParticipants([...])
    ├─→ UI updates: Shows "User2" in participant list
    └─→ Creates WebRTC peer connection for User2:
        ├─→ Create RTCPeerConnection()
        ├─→ Add local stream (camera/mic)
        ├─→ Set up remote stream listener
        └─→ Create and send offer
             ├─→ SDP Offer created
             └─→ Saved to Firestore messages
                 /rooms/{roomId}/messages/{messageId}
                 {
                   type: "offer",
                   from: "user1Id",
                   to: "user2Id",  ← TARGETED TO USER2
                   data: { sdp... },
                   timestamp: now
                 }
```

### STEP 4: User2 Receives Offer
```
Firestore Listener (on User2's browser)
    ↓
    Detects new message in messages collection
    ↓
    Checks: message.to === user2Id? YES
    ├─→ Creates peer connection for User1
    ├─→ Sets remote description (offer received)
    ├─→ Creates and sends answer
    │   Saved to Firestore:
    │   {
    │     type: "answer",
    │     from: "user2Id",
    │     to: "user1Id",
    │     data: { sdp... }
    │   }
    └─→ Starts gathering ICE candidates
        (Finding best network path)
```

### STEP 5: Peer Connection Complete
```
User1 Browser                      User2 Browser
    ↓                                  ↓
    ├─→ Receives Answer            ├─→ Receives Answer
    ├─→ Sets remote description    ├─→ Sets remote description
    │                              │
    ├─→ ICE Candidate Exchange     ├─→ ICE Candidate Exchange
    │   Sends: candidate A          │   Sends: candidate B
    │   Receives: candidate B       │   Receives: candidate A
    │   Sends: candidate C          │   Sends: candidate D
    │   ...                         │   ...
    │                              │
    └─→ Connection State:          └─→ Connection State:
        new → checking               new → checking
              → connected                   → connected
              (usually ~10s)
```

### STEP 6: Media Streams Flow
```
┌─────────────────────────────────────┐
│     User1 ↔ User2 Connected!        │
├─────────────────────────────────────┤

User1 Sends:                      User2 Receives:
  ├─→ Video Track                   └─→ Stored in Map
  │   (camera feed)                     remoteStreamsRef
  │                                     [user2Id] = stream
  ├─→ Audio Track                   └─→ React State Updated:
  │   (microphone)                      setRemoteStreams(Map)
  │                                     └─→ UI Re-renders
  └─→ WebRTC RTCPeerConnection         └─→ Shows User1's video
                                           Shows User1's name

User2 Sends:                      User1 Receives:
  ├─→ Video Track                   └─→ Stored in Map
  │   (camera feed)                     remoteStreamsRef
  │                                     [user1Id] = stream
  ├─→ Audio Track                   └─→ React State Updated:
  │   (microphone)                      setRemoteStreams(Map)
  │                                     └─→ UI Re-renders
  └─→ WebRTC RTCPeerConnection         └─→ Shows User2's video
                                           Shows User2's name
```

---

## Data Structure

### Firebase Firestore Collections

```
studio-483967676-63ce6 (Project)
│
├─ /users/{userId}/
│   └─ User profile information
│
├─ /rooms/
│   └─ /{roomId}/
│       │
│       ├─ participants/
│       │   ├─ {user1Id}
│       │   │   ├─ userId: "user1Id"
│       │   │   ├─ displayName: "User1"  ← NAME DISPLAY
│       │   │   ├─ joinedAt: timestamp
│       │   │   └─ status: "online"
│       │   │
│       │   └─ {user2Id}
│       │       ├─ userId: "user2Id"
│       │       ├─ displayName: "User2"  ← NAME DISPLAY
│       │       ├─ joinedAt: timestamp
│       │       └─ status: "online"
│       │
│       └─ messages/
│           ├─ {messageId1}  (offer from user1)
│           │   ├─ type: "offer"
│           │   ├─ from: "user1Id"
│           │   ├─ to: "user2Id"
│           │   ├─ data: { sdp: "..." }
│           │   └─ timestamp: T1
│           │
│           ├─ {messageId2}  (answer from user2)
│           │   ├─ type: "answer"
│           │   ├─ from: "user2Id"
│           │   ├─ to: "user1Id"
│           │   ├─ data: { sdp: "..." }
│           │   └─ timestamp: T2
│           │
│           ├─ {messageId3}  (ICE candidate)
│           │   ├─ type: "ice-candidate"
│           │   ├─ from: "user1Id"
│           │   ├─ to: "user2Id"
│           │   ├─ data: { candidate: "..." }
│           │   └─ timestamp: T3
│           │
│           └─ ... (more ICE candidates)
```

---

## Component Architecture

```
App Layout
│
├─ FirebaseClientProvider
│  │
│  └─ FirebaseProvider
│     │
│     ├─ FirebaseContext
│     │  ├─ user: User | null
│     │  ├─ firestore: Firestore
│     │  ├─ auth: Auth
│     │  └─ isUserLoading: boolean
│     │
│     └─ Pages
│        ├─ /signup → SignupPage
│        ├─ /login → LoginPage
│        ├─ /dashboard → DashboardPage
│        │
│        └─ /room/[roomId] → Room Page
│           │
│           ├─ Display Name Input
│           ├─ User Mode Selection (Hearing/Deaf)
│           │
│           └─ CallInterface Component ← MAIN COMPONENT
│              │
│              ├─ useWebRTC Hook
│              │  ├─ localStream: MediaStream
│              │  ├─ remoteStream: MediaStream
│              │  ├─ isConnected: boolean
│              │  └─ PeerConnection management
│              │
│              ├─ useFirebase Hook
│              │  ├─ user: User
│              │  ├─ firestore: Firestore
│              │  └─ auth: Auth
│              │
│              ├─ FirebaseSignalingService
│              │  ├─ registerPresence(displayName)
│              │  │  └─→ Saves to /rooms/{roomId}/participants
│              │  │
│              │  ├─ onParticipantsChange(callback)
│              │  │  └─→ Listens to participants collection
│              │  │
│              │  ├─ onMessage(callback)
│              │  │  └─→ Listens to messages collection
│              │  │
│              │  ├─ sendOffer(offer, recipientId)
│              │  │  └─→ Saves to /rooms/{roomId}/messages
│              │  │
│              │  └─ sendAnswer(answer, recipientId)
│              │     └─→ Saves to /rooms/{roomId}/messages
│              │
│              ├─ State Management
│              │  ├─ remoteParticipants: Array<{id, displayName}>
│              │  ├─ remoteStreams: Map<userId, MediaStream>
│              │  ├─ connectionState: RTCPeerConnectionState
│              │  └─ ... other state
│              │
│              ├─ Refs Management
│              │  ├─ peerConnectionsRef: Map<userId, PeerConnection>
│              │  ├─ remoteStreamsRef: Map<userId, MediaStream>
│              │  └─ signalingRef: FirebaseSignalingService
│              │
│              ├─ VideoPlayer Components
│              │  ├─ Main Video: Shows mainViewStream
│              │  │  (first remote stream from Map)
│              │  └─ PIP Video: Shows localStream
│              │     (self preview)
│              │
│              └─ UI Elements
│                 ├─ Participants List
│                 │  ├─ User1 (self)
│                 │  └─ User2 (remote)
│                 │
│                 ├─ Audio/Video Controls
│                 ├─ Screen Share
│                 ├─ Captions Display
│                 └─ Avatar Display
```

---

## Names Flow (Specific Path)

```
User joins meeting with display name "User1"
    ↓
CallInterface Component
    ├─→ Receives displayName as prop
    ├─→ useEffect triggers on mount
    └─→ Calls: registerPresence(displayName)
        │
        └─→ FirebaseSignalingService.registerPresence()
            │
            ├─→ Creates doc reference:
            │   /rooms/{roomId}/participants/{userId}
            │
            ├─→ Writes data:
            │   {
            │     userId: "abc123",
            │     displayName: "User1",  ← SAVED HERE
            │     joinedAt: timestamp,
            │     status: "online"
            │   }
            │
            └─→ await setDoc(presenceRef, data)
                 └─→ Firestore saves data

Later, onParticipantsChange listener fires:
    ├─→ Reads all docs from /rooms/{roomId}/participants
    ├─→ Filters out self
    ├─→ Maps each doc:
    │   {
    │     id: doc.id,
    │     displayName: doc.data().displayName  ← READS HERE
    │   }
    │
    ├─→ Calls callback with array:
    │   [
    │     { id: "user2Id", displayName: "User2" }
    │   ]
    │
    └─→ UI updates:
        ├─→ setRemoteParticipants([...])
        ├─→ Participant list renders:
        │   "User1" (self)
        │   "User2" (remote) ← SHOWS HERE
        │
        └─→ Also used to create peer connection
```

---

## Video Streaming Flow (Specific Path)

```
User1 creates peer connection for User2
    ├─→ pc = new PeerConnection()
    ├─→ pc.addLocalStream(localStream)
    │   └─→ stream.getTracks() added to RTCPeerConnection
    │       ├─→ video track
    │       └─→ audio track
    │
    └─→ pc.createOffer()
        └─→ SDP offer with media description
            └─→ Sent via Firestore message

User2 receives offer
    ├─→ pc = new PeerConnection()
    ├─→ pc.addLocalStream(localStream)
    ├─→ pc.setRemoteDescription(offer)
    └─→ pc.createAnswer()
        └─→ SDP answer
            └─→ Sent via Firestore message

User1 receives answer
    ├─→ pc.setRemoteDescription(answer)
    └─→ Media negotiation complete

ICE Candidate Exchange
    ├─→ User1 finds candidate → sends to User2
    ├─→ User2 finds candidate → sends to User1
    ├─→ ...repeat multiple times...
    └─→ Eventually: Connected state

Media Streams Flow
    ├─→ User1's video track
    │   └─→ RTCPeerConnection sends
    │       └─→ User2's RTCPeerConnection receives
    │           └─→ ontrack event fired
    │               └─→ stream.addTrack(videoTrack)
    │                   └─→ remoteStream = new stream with video track
    │                       └─→ remoteStreamsRef.set(user1Id, remoteStream)
    │                           └─→ setRemoteStreams(new Map(...))
    │                               └─→ UI Re-renders
    │                                   └─→ VideoPlayer gets stream
    │                                       └─→ Shows live video
    │
    └─→ User1's audio track
        └─→ Same flow, audio plays through speakers
```

---

## Multi-User Architecture (3+ Users)

```
User1 Browser                  User2 Browser                  User3 Browser
    │                              │                              │
    ├─ PeerConnection for User2   ├─ PeerConnection for User1   ├─ PeerConnection for User1
    │  └─ remoteStream: User2     │  └─ remoteStream: User1     │  └─ remoteStream: User1
    │                             │                             │
    ├─ PeerConnection for User3   ├─ PeerConnection for User3   ├─ PeerConnection for User2
    │  └─ remoteStream: User3     │  └─ remoteStream: User3     │  └─ remoteStream: User2
    │                             │                             │
    └─ Main video shows:          └─ Main video shows:          └─ Main video shows:
       User2 (first in map)          User1 (first in map)          User1 (first in map)
       
Firestore /participants: {User1, User2, User3}
Firestore /messages: Offers/answers/ICE between all pairs
```

---

## Security & Rules

```
Firestore Rules (/firestore.rules)

/rooms/{roomId}/participants/{userId}
    ├─ read: ✓ All authenticated users
    ├─ write: ✓ Only if auth.uid == userId (self only)
    └─ delete: ✗ Not allowed

/rooms/{roomId}/messages/{messageId}
    ├─ read: ✓ All authenticated users
    ├─ create: ✓ All authenticated users
    └─ delete: ✓ Only if sender or recipient

This allows:
✓ User1 saves own presence
✓ User2 reads User1's presence
✓ User1 sends message to User2
✓ User2 reads message from User1
```

---

## Summary

The system works as follows:

1. **Names**: Saved in Firestore participants collection → Read by listeners → Displayed in UI
2. **Peer Connections**: One per remote user → Stored in Map → Managed by WebRTC service
3. **Video**: Tracks from RTCPeerConnection → Stored in remote streams Map → Rendered by VideoPlayer
4. **Signaling**: Firestore is the intermediary → All offer/answer/ICE goes through messages collection

**Result**: Real-time two-way video and audio with proper display names!

---

This architecture ensures:
✅ Scalable to many users
✅ Real-time updates
✅ Secure communication
✅ Low latency
✅ Proper name display
✅ Quality video/audio
