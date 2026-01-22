# Complete Setup Instructions for Two-User Testing

## What's Been Done

The application has been enhanced with comprehensive logging at every step of the WebRTC and Firebase signaling process. The code includes:

✅ **Firebase Signaling Service** (`src/lib/firebase-signaling.ts`)
- Enhanced logging for presence registration
- Detailed logs when participants change
- Full debugging info about Firestore data

✅ **Call Interface** (`src/components/call-interface.tsx`)
- Logs for initialization
- Logs for peer connection creation
- Logs for signaling message handling
- Logs for remote stream reception

✅ **WebRTC Service** (`src/lib/webrtc-service.ts`)
- Solid PeerConnection wrapper
- Error handling for secure context
- STUN server configuration for NAT traversal

✅ **Firestore Rules** (`firestore.rules`)
- Permissions configured for room-based signaling
- Allows authenticated users to read/write participants
- Allows message creation for offer/answer/ICE exchange

## Server Status

✅ **Server Running**: The development server is currently running on port 9002
- Local: `http://localhost:9002`
- Network: `http://192.168.1.17:9002`
- HTTPS: Use ngrok for remote access

## Step-by-Step Testing

### Step 1: Open First Browser Window

**Computer 1**:
```
URL: http://localhost:9002
```

**Actions**:
1. Sign Up with email: `user1@test.com`, password: `Test@123`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Enter Display Name: `User1`
5. Select User Mode: "Hearing" or "Deaf/Mute"
6. Click "Join now"

**Monitor Console**: Watch for logs starting with `[CallInterface]` and `[FirebaseSignaling]`

### Step 2: Open Second Browser Window

**Computer 2** (choose one):

**Option A - Same Computer (New Incognito Window)**:
```
URL: http://localhost:9002
```

**Option B - Same WiFi**:
```
URL: http://192.168.1.17:9002
(Replace 192.168.1.17 with your actual IP from step 1 logs)
```

**Option C - Different Network (requires ngrok)**:

In a NEW terminal:
```powershell
ngrok http 9002
```

Look for:
```
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:9002
```

Use the `https://abc123def456.ngrok.io` URL in Browser 2

**Actions**:
1. Sign Up with email: `user2@test.com`, password: `Test@123`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Enter Display Name: `User2`
5. Select opposite User Mode (if User1 chose "Hearing", choose "Deaf/Mute")
6. Click "Join now"

### Step 3: Verify Success

#### Browser 1 Checks:
```
✓ Participant list shows "User2"
✓ Main video shows User2's video (not placeholder)
✓ Can hear User2's audio
✓ No red errors in console
```

#### Browser 2 Checks:
```
✓ Participant list shows "User1"
✓ Main video shows User1's video (not placeholder)
✓ Can hear User1's audio
✓ No red errors in console
```

#### Console Verification (Both):

**In Browser 1, look for**:
```
[CallInterface] Presence registered: true
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
[FirebaseSignaling] ===== PARTICIPANTS SNAPSHOT RECEIVED =====
[CallInterface] Creating peer connection for: [userId] User2
[CallInterface] Remote stream received from: [userId]
[CallInterface] Remote stream video tracks: 1
[CallInterface] Remote stream audio tracks: 1
```

**In Browser 2, look for**:
```
[CallInterface] Presence registered: true
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
[FirebaseSignaling] ===== PARTICIPANTS SNAPSHOT RECEIVED =====
[CallInterface] Creating peer connection for: [userId] User1
[CallInterface] Remote stream received from: [userId]
[CallInterface] Remote stream video tracks: 1
[CallInterface] Remote stream audio tracks: 1
```

## Troubleshooting Immediately

### If Names Show "Unknown"

**Check This in Console**:
```javascript
// You should see:
[FirebaseSignaling] Data to write: { ..., displayName: 'User1', ... }
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
```

**If you see error instead**:
1. Check Firestore Rules (might be blocking writes)
2. Check browser permissions for Firestore auth
3. Refresh page and try again

### If Video Shows Placeholder

**Check This in Console**:
```javascript
// You should see:
[CallInterface] Remote stream received from: [userId]
[CallInterface] Remote stream video tracks: 1
```

**If you see `video tracks: 0`**:
1. Video not being sent by remote peer
2. Peer connection offer/answer not completing
3. Check Firestore for `offer` messages in messages collection

### If No Console Logs

**Actions**:
1. Press F12 to open Developer Tools
2. Click "Console" tab
3. Click trash icon to clear
4. Refresh page (F5)
5. Watch logs immediately after refresh
6. Filter for "CallInterface" in search box

## Critical Files for Reference

| File | Purpose |
|------|---------|
| `src/lib/firebase-signaling.ts` | Firebase Firestore signaling (offers/answers/ICE) |
| `src/lib/webrtc-service.ts` | WebRTC peer connection management |
| `src/components/call-interface.tsx` | Main video call UI and orchestration |
| `src/firebase/config.ts` | Firebase configuration |
| `firestore.rules` | Firestore security rules |
| `next.config.ts` | Next.js configuration |

## Expected Behavior Timeline

### Browser 1 Timeline
1. **T+0s**: User signs in, Creates/joins room, Enters display name
2. **T+1s**: Presence registered with name "User1"
3. **T+2s**: Listener waiting for other participants
4. **T+30s** (after User2 joins): Listener fires with User2 in list
5. **T+32s**: Peer connection created for User2
6. **T+33s**: Offer sent to User2
7. **T+35s**: Receives answer from User2
8. **T+36s**: ICE candidates exchanged
9. **T+40s**: Video stream received, remote video displays

### Browser 2 Timeline
1. **T+25s**: User signs in, Joins room, Enters display name
2. **T+26s**: Presence registered with name "User2"
3. **T+27s**: Listener fires with User1 in list
4. **T+28s**: Peer connection created for User1
5. **T+29s**: Receives offer from User1
6. **T+30s**: Sends answer to User1
7. **T+31s**: ICE candidates exchanged
8. **T+35s**: Video stream received, remote video displays

## Network Considerations

### STUN Servers (Currently Configured)
- Google STUN servers for NAT traversal
- Should work for most networks
- May not work behind restrictive corporate firewalls

### Firewall Rules
- Port 9002: Must be open for local/network access
- WebRTC: Uses UDP ports (not traditionally required but may help)
- Firestore: HTTPS only (port 443)

## Success Criteria

### Minimum Success
✅ Names display correctly on both screens
✅ Audio working in at least one direction
✅ No console errors

### Full Success
✅ Names display correctly on both screens
✅ Video streams display on both screens
✅ Audio works bidirectionally
✅ Console shows all expected logs
✅ No errors or warnings

## Next Steps After Success

1. Test with 3rd participant
2. Test muting/unmuting audio and video
3. Test screen sharing (if available)
4. Test with different networks
5. Performance test with multiple simultaneous calls
6. Consider deploying to production

## Support

If you encounter issues:

1. **Check Console Logs First**: The enhanced logging will tell you exactly where the process fails
2. **Check Firestore Rules**: Ensure writes are being permitted
3. **Check Firebase Project**: Verify Authentication and Firestore are enabled
4. **Check Network**: Ensure both computers can reach the app URL
5. **Check Permissions**: Browser permissions for camera/microphone must be granted

---

**Ready to Test?** Follow the Step-by-Step Testing section above to get started!
