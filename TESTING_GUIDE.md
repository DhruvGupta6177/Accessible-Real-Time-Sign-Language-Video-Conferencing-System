# Real-Time Sign Language Testing Guide

## Overview
This guide walks you through testing the application on two different computers to verify that:
1. Participant names display correctly
2. Real-time video streaming works
3. Audio works bidirectionally

## Enhanced Logging
The application now includes detailed logging at every step of the WebRTC connection process. When you open the browser console (F12), you'll see comprehensive logs prefixed with `[CallInterface]` and `[FirebaseSignaling]`.

## Setup Requirements

### Prerequisites
- **Computer 1**: Your development machine with the app running
- **Computer 2**: Another computer (can be same person, different browser window, or different person)
- **Firestore Console**: Access to Firebase project (for verification)
- **ngrok**: For HTTPS tunnel (if Computer 2 is on a different network)

### Network Access
The application runs on port 9002:
- **Local access**: `http://localhost:9002` (Computer 1 only)
- **Network access**: `http://192.168.1.17:9002` (Computer 1 on same WiFi)
- **Remote access**: `https://abc123.ngrok.io` (via ngrok tunnel)

## Testing Procedure

### Step 1: Prepare Computer 1 (Main Application)

#### 1.1 Verify Server is Running
```powershell
# Terminal shows:
# ✓ Ready in 3.6s
# ✓ Compiled /api/server-ip in 6.3s
```

#### 1.2 Open Browser Developer Tools
1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Set up a filter to show only relevant logs:
   - Search for: `CallInterface` or `FirebaseSignaling`
4. Keep console visible during testing

#### 1.3 Create Account (if needed)
- Open `http://localhost:9002`
- Click "Sign Up"
- Enter email: `user1@test.com`
- Enter password: `Test@123`
- Click "Create Account"

#### 1.4 Create/Join Meeting
1. After login, click "Create Meeting"
2. Enter **Display Name**: `User1` (exactly this)
3. Click the meeting (it should have an ID like "room123")

#### 1.5 Select User Mode
1. Choose "Hearing" or "Deaf/Mute"
2. You should see "Ready to join?" screen
3. Verify camera/mic work in preview
4. Click "Join now"

**IMPORTANT: Look at the console logs here**
```
[CallInterface] Initialization dependencies: { user: 'abc123', roomId: 'room123', ... }
[CallInterface] Creating FirebaseSignalingService with: { userId: '...', ... }
[CallInterface] Registering presence with name: User1
[FirebaseSignaling] ===== REGISTERING PRESENCE =====
[FirebaseSignaling] Path: rooms/room123/participants/abc123
[FirebaseSignaling] Data to write: { userId: 'abc123', displayName: 'User1', ... }
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
```

**If you don't see these logs**: Scroll up in the console, as initial logs might be above the fold.

### Step 2: Prepare Computer 2 (Secondary User)

#### 2.1 Get the Room URL
**Option A: Same Network**
- If Computer 2 is on same WiFi: Use `http://192.168.1.17:9002` (get IP from your router)

**Option B: Different Network (use ngrok)**
1. Open a NEW terminal window
2. Run: `ngrok http 9002`
3. Copy the HTTPS URL (format: `https://abc123def456.ngrok.io`)
4. This URL is valid for 2 hours

**Option C: Same Computer**
- Open a new Incognito window
- Use `http://localhost:9002`

#### 2.2 Create Second Account
- Open the application URL
- Click "Sign Up"
- Enter email: `user2@test.com`
- Enter password: `Test@123`
- Click "Create Account"

#### 2.3 Join Same Meeting
1. You should see a "Join Meeting" screen
2. Look for the meeting created by User1
3. Enter **Display Name**: `User2` (exactly this)
4. Click "Join"

#### 2.4 Select User Mode
1. Choose opposite mode from User1 (if User1 chose "Hearing", choose "Deaf/Mute")
2. Verify camera/mic work in preview
3. Click "Join now"

### Step 3: Monitor Console Logs - CRITICAL FOR DEBUGGING

Open Developer Tools (F12) on BOTH computers and watch for these critical log sequences:

#### 2.1 User2 Registering Presence
```
[FirebaseSignaling] ===== REGISTERING PRESENCE =====
[FirebaseSignaling] Path: rooms/room123/participants/user2Id
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
```

#### 2.2 User1's Participants Listener Fires (User2 Joins)
```
[FirebaseSignaling] ===== PARTICIPANTS SNAPSHOT RECEIVED =====
[FirebaseSignaling] Total documents: 2
[FirebaseSignaling] All documents:
[FirebaseSignaling]   - user1Id : { userId: '...', displayName: 'User1', ... }
[FirebaseSignaling]   - user2Id : { userId: '...', displayName: 'User2', ... }
[FirebaseSignaling] Document user1Id: shouldInclude=false (filtered=true)
[FirebaseSignaling] Document user2Id: shouldInclude=true (filtered=false)
[FirebaseSignaling] Mapped participant: { id: 'user2Id', displayName: 'User2' }
[FirebaseSignaling] Final participants list to callback: [{ id: 'user2Id', displayName: 'User2' }]
```

#### 2.3 Peer Connection Created
```
[CallInterface] Creating peer connection for: user2Id User2
[CallInterface] Local stream available: true
[CallInterface] Adding local stream to peer connection for: user2Id
[CallInterface] Created offer for: user2Id
```

#### 2.4 Offer/Answer Exchange
```
[CallInterface] Received signaling message: offer from: user1Id
[CallInterface] Creating peer connection for incoming message from: user1Id
[CallInterface] Adding local stream to incoming peer connection from: user1Id
[CallInterface] Remote stream received from: user1Id
[CallInterface] Remote stream video tracks: 1
[CallInterface] Remote stream audio tracks: 1
```

## Verification Checklist

### Checklist for Successful Connection

- [ ] **On User1's screen**:
  - [ ] Participant list shows "User2" (not "Unknown")
  - [ ] Video player shows User2's camera feed (not placeholder image)
  - [ ] Can hear User2's audio
  - [ ] "Connected" status visible (or no "Connecting..." message)

- [ ] **On User2's screen**:
  - [ ] Participant list shows "User1" (not "Unknown")
  - [ ] Video player shows User1's camera feed (not placeholder image)
  - [ ] Can hear User1's audio
  - [ ] "Connected" status visible

- [ ] **In Browser Console**:
  - [ ] No red error messages
  - [ ] All participants appear in logs with correct displayNames
  - [ ] Remote streams show correct track counts (1 video, 1 audio)
  - [ ] No "permission denied" messages

## Troubleshooting

### Issue: Names Show "Unknown" Instead of Real Names

**Root Cause**: Display name not being saved to Firestore

**Debug Steps**:
1. Check console for: `Registering presence with name: User1` 
2. Verify it shows: `===== PRESENCE REGISTERED SUCCESSFULLY =====`
3. Open Firebase Console → Firestore → `rooms/roomId/participants`
4. **Expected**: Should see documents with `displayName: "User1"`, `displayName: "User2"`
5. **If missing**: Check Firestore rules in `firestore.rules`

**Fix**:
```typescript
// Verify in call-interface.tsx line 151-152:
const presenceSuccess = await signalingRef.current.registerPresence(displayName);
console.log('[CallInterface] Presence registered:', presenceSuccess);
```

### Issue: Remote Video Shows Placeholder Image

**Root Cause**: Peer connection not receiving video tracks

**Debug Steps**:
1. Check console for: `Remote stream received from: [userId]`
2. Verify it shows: `Remote stream video tracks: 1`
3. If it shows `video tracks: 0`: Video track not being received
4. Check if `Local stream available: true` appears before peer connection creation

**Fix**:
```typescript
// Verify local stream is being added
console.log('[CallInterface] Adding local stream to peer connection for:', participant.id);
pc.addLocalStream(localStream);
```

### Issue: Can't Connect to Remote Computer

**Solutions**:
1. **Same network**: Use `http://192.168.1.17:9002` (get correct IP)
2. **Different network**: Use ngrok tunnel (must generate fresh URL)
3. **Firewall**: Allow port 9002 in Windows Firewall
4. **HTTPS requirement**: WebRTC requires HTTPS for remote access - must use ngrok

### Issue: "NotAllowedError: Permission denied"

**Cause**: Browser permissions for camera/mic

**Fix**:
1. Check address bar for camera icon (should be open)
2. Click it and allow camera + microphone
3. Reload page (F5)
4. Try again

### Issue: Browser Console Shows No Logs

**Causes**:
1. Console filter is blocking logs
2. Logs already scrolled off
3. Component not rendering

**Fix**:
1. Clear filter (remove any text in search box)
2. Clear console history (garbage icon)
3. Reload page
4. Watch for logs immediately after page loads

## Advanced Debugging

### Firestore Console Verification

To verify data is actually being written to Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `studio-483967676-63ce6`
3. Go to Firestore Database
4. Navigate to: `rooms` → `[roomId]` → `participants`
5. **Expected**: Should see documents with:
   ```json
   {
     "userId": "user1Id",
     "displayName": "User1",
     "joinedAt": "timestamp",
     "status": "online"
   }
   ```

### ICE Candidate Exchange

If video connects but audio doesn't, or connection is unstable:

1. Check for `Sending ICE candidate to:` logs
2. Should appear many times (ICE gathers multiple candidates)
3. If absent: Check Firestore rules for messages collection

### Network Inspection

1. Open DevTools → Network tab
2. Filter to `message` or `participants`
3. Watch for Firestore read/write operations
4. Status should be `200` (success)

## Next Steps After Successful Test

Once the test passes:
1. [ ] Test with 3+ participants
2. [ ] Test screen sharing (if implemented)
3. [ ] Test audio/video toggle
4. [ ] Test with different internet speeds
5. [ ] Deploy to production

## Important Notes

- **Firestore Rules**: Located in `firestore.rules`
  - Allows authenticated users to read/write `/rooms/{roomId}/participants`
  - Allows authenticated users to read/create `/rooms/{roomId}/messages`

- **WebRTC Configuration**: In `src/lib/webrtc-service.ts`
  - Uses Google STUN servers for NAT traversal
  - No TURN servers configured (may have issues on some networks)

- **Signaling Service**: In `src/lib/firebase-signaling.ts`
  - Uses Firestore as a signaling channel
  - `participants` collection for presence
  - `messages` collection for offer/answer/ICE

## Additional Resources

- Firestore Rules Documentation: `firestore.rules`
- WebRTC Service: `src/lib/webrtc-service.ts`
- Signaling Service: `src/lib/firebase-signaling.ts`
- Call Interface: `src/components/call-interface.tsx`
- Firebase Provider: `src/firebase/provider.tsx`

---

**Contact**: If issues persist, check the detailed console logs and report them with full log output.
