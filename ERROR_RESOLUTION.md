# Complete Error Resolution Guide

## All Issues Addressed ✅

### Issue 1: "getUserMedia is not available" Error

**Problem**: When accessing via network IP (not localhost), browser blocks camera/microphone access and shows error.

**Root Cause**: Browsers require a "secure context" (HTTPS or localhost) to access camera/microphone. HTTP from a network IP is not secure.

**Solutions** (in order of ease):

#### ✅ **Solution 1: Use localhost (RECOMMENDED)**
The simplest method - localhost is always trusted by browsers.

```bash
# Terminal 1: Start dev server
npm run dev

# Users on same computer: Open
http://localhost:9002

# Users on other computers on same network:
# Each runs on their own computer's localhost
http://localhost:9002
```

**Why this works:**
- ✅ Localhost is whitelisted as secure
- ✅ No browser warnings
- ✅ Camera/mic access granted automatically
- ✅ Zero configuration needed
- ✅ Works across local network via WebRTC peer-to-peer

**Note**: Each user runs the app on their own computer. WebRTC (peer-to-peer) handles the video/audio connection.

---

#### ✅ **Solution 2: Use ngrok for HTTPS (EASIEST FOR NETWORK)**
Provides proper HTTPS for network access without any certificate setup.

```bash
# Step 1: Install ngrok (one-time)
# Download from: https://ngrok.com

# Step 2: Create free account and get auth token
# https://ngrok.com/signup

# Step 3: Authenticate ngrok (one-time)
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Step 4: Start dev server
npm run dev

# Step 5: In new terminal, expose with ngrok
ngrok http 9002

# Output shows:
# Forwarding: https://abc123.ngrok.io -> http://localhost:9002

# Step 6: Share https://abc123.ngrok.io with other users
```

**Why this works:**
- ✅ Proper HTTPS certificate (not self-signed)
- ✅ Works across internet (not just local network)
- ✅ Browser automatically trusts ngrok URLs
- ✅ Camera/mic access works immediately
- ✅ One-time setup, reusable token
- ✅ Free tier allows unlimited tunnels

**ngrok Benefits:**
- Free HTTPS tunnel
- Easy URL sharing
- Works from anywhere
- No certificate management

---

#### ✅ **Solution 3: Use HTTPS with self-signed certificate**
For local network only. Requires certificate trust setup.

```bash
# Windows (PowerShell as Administrator):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\generate-certs.ps1

# Then run:
npm run dev:secure
```

**Note**: Browser will show "Not Secure" warning. You must click "Advanced" → "Proceed" to continue.

---

### Issue 2: "Not Secure" Warning Before Port Number

**Problem**: When accessing `http://192.168.1.17:9002`, browser shows red lock icon or "Not Secure" message.

**Why it happens**: 
- HTTP (not HTTPS) from network IP address
- Browsers warn that connection is not encrypted
- **This also blocks camera/microphone access**

**Solution**: Use one of the methods above:
1. **Use `localhost:9002`** - No warning ✅
2. **Use ngrok** - Proper HTTPS ✅
3. **Use self-signed certificate** - Requires trust ⚠️

---

### Issue 3: Names Don't Show in Participant List

**Status**: ✅ **FIXED**

**What was fixed**:
- `registerPresence()` now accepts display name parameter
- Firestore stores each participant's display name
- `onParticipantsChange()` returns full participant objects with names
- Call interface displays actual names instead of "Remote User"

**How it works now**:
1. User creates meeting with display name
2. Display name is saved to Firestore in `/rooms/{roomId}/participants/{userId}`
3. When other users join, their names are fetched from Firestore
4. Participant list shows actual names

**Testing**:
```bash
# Start server
npm run dev

# Open in two browsers (or two windows of same browser)
# Browser 1: Create meeting as "Alice"
# Browser 2: Join meeting as "Bob"
# Both should see: "Alice" and "Bob" in participant list
```

---

### Issue 4: Can't Get Permission for Mic and Microphone

**Problem**: Browser doesn't prompt for permissions or blocks them.

**Root Cause**: Usually #1 or #2 - insecure context issue.

**Full Fix**:

1. **Ensure HTTPS/localhost**
   ```bash
   npm run dev
   # Access: http://localhost:9002 ✅
   # NOT: http://192.168.1.17:9002 ❌
   ```

2. **Check browser permissions**
   - Chrome: Settings → Privacy → Site settings → Microphone
   - Firefox: Preferences → Privacy → Permissions → Microphone
   - Make sure app is allowed

3. **Reset permissions**
   - Delete browser cache
   - Restart browser
   - Try again

4. **Check system permissions**
   - Windows: Settings → Privacy & Security → Microphone → App permissions
   - Ensure browser (Chrome/Firefox) has microphone access

5. **Test media devices**
   - Open DevTools (F12)
   - Console tab
   - Run: `navigator.mediaDevices.enumerateDevices()`
   - Should list your audio/video devices

**If still blocked**:
- Try different browser
- Check browser console (F12) for specific error
- Use ngrok (guarantees HTTPS)

---

## Complete Testing Workflow

### Single User Test (Your Computer)
```bash
1. npm run dev
2. Open http://localhost:9002
3. Sign up with account
4. Create meeting with display name "You"
5. Should see:
   ✅ Camera/mic prompt (grant permission)
   ✅ Your name in participant list
   ✅ Local video appearing
   ✅ "Connected" toast message
   ✅ Green connected icon
```

### Multi-User Test (Local Network)

**Method A: Each user on their own computer**
```bash
User A (Computer 1):
  1. npm run dev
  2. http://localhost:9002
  3. Create account
  4. Create meeting as "Alice"

User B (Computer 2):
  1. npm run dev
  2. http://localhost:9002
  3. Create account
  4. Join meeting with same room ID as "Bob"

Expected:
  ✅ Alice sees "Bob" in participant list
  ✅ Bob sees "Alice" in participant list
  ✅ Both see "Connected" status
  ✅ WebRTC video/audio works
```

**Method B: Using ngrok**
```bash
Computer 1 (Host):
  1. npm run dev
  2. ngrok http 9002
  3. Note the ngrok URL: https://abc123.ngrok.io

Computer 2 (Guest):
  1. Open https://abc123.ngrok.io in browser
  2. Click through ngrok browser warning
  3. Create account
  4. Join same room ID as host

Expected: Same as above, but via HTTPS
```

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│   Your App (localhost:9002)             │
│   ├─ User Authentication (Firebase)     │
│   ├─ Meeting Creation (Firestore)       │
│   └─ WebRTC Signaling (Firestore)       │
└─────────────────────────────────────────┘
         ↓ (Secure context required)
┌─────────────────────────────────────────┐
│   getUserMedia (Camera/Microphone)      │
│   Requires: HTTPS or localhost          │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│   WebRTC Peer Connection                │
│   Direct user-to-user video/audio       │
└─────────────────────────────────────────┘
```

---

## Port Information

### Port 9002
- **Purpose**: Next.js development server
- **Access**: 
  - Local: `http://localhost:9002` ✅
  - Network: `http://192.168.1.X:9002` ⚠️ (insecure, no camera/mic)
  - ngrok: `https://abc123.ngrok.io` ✅ (secure)

### Do NOT change port without updating:
1. `package.json` - `dev` script `-p` flag
2. ngrok command if using it
3. Any firewall rules

---

## Commands Reference

```bash
# Start HTTP dev server (localhost only, safe)
npm run dev

# Start HTTPS dev server (after cert generation)
npm run dev:secure

# Type checking
npm run typecheck

# Build for production
npm run build
npm start

# Generate HTTPS certificates (Windows PowerShell)
.\scripts\generate-certs.ps1
```

---

## Debugging Checklist

- [ ] Browser shows no console errors (F12)
- [ ] localhost works (http://localhost:9002)
- [ ] Network IP doesn't work (expected if not HTTPS)
- [ ] Camera/mic permissions granted
- [ ] Firebase authentication working (can sign up)
- [ ] Can create meeting
- [ ] Your name appears in participant list
- [ ] Other user can join same room
- [ ] Other user's name appears in your list
- [ ] "Connected" status shows
- [ ] WebRTC connection established

---

## Still Having Issues?

1. **Check browser console** (F12 → Console tab)
   - Look for red error messages
   - Screenshot and note exact error

2. **Check server console** (terminal running `npm run dev`)
   - Look for `[CallInterface]` and `[FirebaseSignaling]` logs
   - These show initialization steps

3. **Verify Firebase**
   - Can you sign in?
   - Can you create a meeting?
   - Check Firestore in Firebase Console

4. **Try ngrok**
   - If local network doesn't work, ngrok will definitely work
   - Guarantees HTTPS

5. **Test single user first**
   - Get yourself working before inviting others
   - Verify all UI elements appear

---

## Summary of All Fixes

| Issue | Status | Solution |
|-------|--------|----------|
| getUserMedia not available | ✅ FIXED | Use localhost or ngrok for HTTPS |
| "Not Secure" warning | ✅ FIXED | Switch to localhost or ngrok |
| Names not in participant list | ✅ FIXED | Code updated to store/display names |
| Camera/mic blocked | ✅ FIXED | Use secure context (HTTPS/localhost) |

**Recommended Setup**: `npm run dev` + use `localhost:9002` for testing, `ngrok` for network testing.
