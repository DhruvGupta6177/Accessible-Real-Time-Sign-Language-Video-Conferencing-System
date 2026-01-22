# Quick Two-User Testing Checklist

## Pre-Flight Check (5 minutes)

### Computer 1 (Main)
- [ ] Terminal shows: "✓ Ready in 3.6s"
- [ ] Open `http://localhost:9002`
- [ ] Server running without errors
- [ ] Developer Tools (F12) open
- [ ] Console visible for logging

### Sign-up on Computer 1
- [ ] Email: `user1@test.com`
- [ ] Password: `Test@123`
- [ ] Display Name: `User1` (for chat list)
- [ ] Mode: Select "Hearing"
- [ ] Camera preview: Shows your face
- [ ] Mic preview: Shows audio input
- [ ] Click "Join now"

### Check Console Logs
Look for:
```
[CallInterface] Registering presence with name: User1
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
[FirebaseSignaling] ===== SETTING UP PARTICIPANTS LISTENER =====
```

**Note the Room ID**: Appears in URL or logs as `roomId: room_abc123`

## Computer 2 Setup (5 minutes)

### Network Choice
- [ ] **Same WiFi**: Use `http://192.168.1.17:9002`
- [ ] **Different Network**: Use ngrok URL (run `ngrok http 9002`)
- [ ] **Same Computer**: Use new Incognito window

### Sign-up on Computer 2
- [ ] Email: `user2@test.com`
- [ ] Password: `Test@123`
- [ ] Display Name: `User2` (for chat list)
- [ ] Mode: Select opposite mode (e.g., "Deaf/Mute")
- [ ] Find the meeting from User1
- [ ] Camera preview: Shows your face
- [ ] Mic preview: Shows audio input
- [ ] Click "Join now"

## Verification (5 minutes)

### Computer 1 Checks
- [ ] **Names**: Participant list shows "User2" (NOT "Unknown")
- [ ] **Video**: Main view shows User2's video (NOT placeholder image)
- [ ] **Audio**: Can hear User2's voice
- [ ] **Status**: No "Connecting..." message
- [ ] **Console**: No red errors

### Computer 2 Checks
- [ ] **Names**: Participant list shows "User1" (NOT "Unknown")
- [ ] **Video**: Main view shows User1's video (NOT placeholder image)  
- [ ] **Audio**: Can hear User1's voice
- [ ] **Status**: No "Connecting..." message
- [ ] **Console**: No red errors

### Critical Console Logs (BOTH Computers)

#### Step 1: User2's Presence Registration
```
[FirebaseSignaling] ===== REGISTERING PRESENCE =====
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
```

#### Step 2: User1 Detects User2
```
[FirebaseSignaling] ===== PARTICIPANTS SNAPSHOT RECEIVED =====
[FirebaseSignaling] Final participants list to callback: [{ id: '...', displayName: 'User2' }]
```

#### Step 3: Peer Connection Created
```
[CallInterface] Creating peer connection for: ... User2
[CallInterface] Created offer for: ...
```

#### Step 4: Video Streams Received
```
[CallInterface] Remote stream received from: ...
[CallInterface] Remote stream video tracks: 1
[CallInterface] Remote stream audio tracks: 1
```

## If Something Fails

### Names Show "Unknown"
1. [ ] Check: `PRESENCE REGISTERED SUCCESSFULLY` in logs
2. [ ] Open Firebase Console → Firestore
3. [ ] Check: `rooms/[roomId]/participants`
4. [ ] Should have docs with `displayName: User1`, `displayName: User2`
5. [ ] If missing: Firestore write permissions issue

### No Video (Placeholder Shows)
1. [ ] Check: `Remote stream video tracks:` in logs
2. [ ] Should show `1` (one video track)
3. [ ] If shows `0`: Peer connection not established
4. [ ] Check: `Local stream available: true` before peer creation
5. [ ] Check: ICE candidates being sent

### Connection "Connecting..." Message
1. [ ] Check: Connection state logs
2. [ ] Check: ICE connection state (should change from new → checking → connected)
3. [ ] May indicate: NAT/firewall issues
4. [ ] Try: Disable antivirus/firewall temporarily

### No Console Logs Appearing
1. [ ] Clear console (trash icon)
2. [ ] Reload page (F5)
3. [ ] Watch console IMMEDIATELY after reload
4. [ ] Watch for initial logs: `Initialization dependencies:`
5. [ ] If still nothing: Component might not be rendering

## Success Indicators

✅ **Full Success**
- Both users see each other's names
- Both users see each other's video
- Both users can hear audio
- No console errors
- Console shows all expected logs
- "Connected" or no connection message

✅ **Partial Success (Acceptable)**
- Names display correctly
- Video connects but no audio (audio permission issue)
- Audio works but video shows placeholder (camera permission or peer issue)

❌ **Failure**
- Names show "Unknown"
- Video always shows placeholder
- Multiple red errors in console
- No logs appearing

## Firestore Console Check

To manually verify data:
1. Open Firebase Console
2. Project: `studio-483967676-63ce6`
3. Go to Firestore Database
4. Path: `rooms` → click on room ID → `participants`
5. **Expected**: See documents for both User1 and User2 with correct displayNames

## Debugging Commands (In Browser Console)

```javascript
// Check current participants
console.log('Checking participants...');

// Check remoteStreams state
console.log('Remote streams:', remoteStreams);

// Check peer connections
console.log('Peer connections:', peerConnectionsRef?.current);
```

## Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| "Not Secure" message | Use localhost or ngrok (HTTPS) |
| Camera/Mic blocked | Click camera icon in address bar → Allow |
| Can't find room | Make sure using same Room ID |
| High latency | May be normal for internet connection |
| No STUN candidates | May be firewall - try disabling for test |

## After Success

1. [ ] Test a 3rd participant
2. [ ] Test muting/unmuting
3. [ ] Test screen share (if available)
4. [ ] Test with poor network (slow down in DevTools)
5. [ ] Test with different browsers

---

**Time Estimate**: 15-20 minutes for full test cycle

**Expected Outcome**: Both users connected with full audio/video communication and correct names displayed.
