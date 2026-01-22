# Real-Time Sign Language - Complete Setup & Troubleshooting Guide

## Quick Start (Simplest Method)

### Local Testing (Same Computer)
```bash
npm run dev
# Open: http://localhost:9002
```

✅ **Works perfectly** - localhost is trusted by browsers
✅ Camera/mic access allowed
✅ No security warnings

### Network Testing (Multiple Devices)

If you want other users on your network to join:

#### Option 1: Use HTTPS with ngrok (Recommended - Easiest)

1. **Install ngrok** (free account required):
   - Download from: https://ngrok.com/download
   - Create free account at: https://ngrok.com/signup
   - Authenticate: `ngrok config add-authtoken YOUR_TOKEN`

2. **Start your dev server:**
   ```bash
   npm run dev
   # Runs on http://localhost:9002
   ```

3. **In a new terminal, expose with ngrok:**
   ```bash
   ngrok http 9002
   ```

4. **Share the HTTPS URL** from ngrok:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:9002
   ```
   - Send this URL to other users: `https://abc123.ngrok.io`
   - Users will see the ngrok browser verification, then can access the app
   - Camera/mic will work (ngrok provides proper HTTPS)

**Why this works:**
- ✅ Free HTTPS with real certificate (not self-signed)
- ✅ Works across the internet
- ✅ Browser allows camera/mic access
- ✅ Simple one-command setup

#### Option 2: Local Network with Workaround

If all users are on the **same local network** and want to avoid ngrok:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **All users access from localhost:**
   - On each computer: `http://localhost:9002`
   - Each person runs the app on their own computer
   - They connect to each other via WebRTC (peer-to-peer)

3. **Share your local IP (optional, if you're the host):**
   - Find your IP: `ipconfig` (look for IPv4 Address)
   - Example: `http://192.168.1.17:9002`
   - Note: Browser will show "Not Secure" and block camera/mic
   - Use ngrok instead for this scenario

## Understanding the "Not Secure" Warning

### Why It Appears
- **HTTP** (not HTTPS) from network IP address
- Browsers block camera/microphone access for security
- Only HTTPS or localhost are considered "secure context"

### Solutions
1. **Use localhost** - Most reliable, no warnings ✅
2. **Use ngrok** - HTTPS tunnel, works across internet ✅
3. **Use self-signed certificate** - Works on local network, requires trust setup

## Architecture

### Port Assignment
- **Port 9002** - Your development server (HTTP or HTTPS)
- All users on the same local network or via ngrok connect to this port
- WebRTC handles peer-to-peer video/audio
- Firebase Firestore handles signaling (offer/answer/ICE candidates)

### Data Flow
```
User A (localhost:9002) 
  ↓ (Firebase Signaling via Firestore)
  ↓ (WebRTC Peer Connection)
User B (localhost:9002 or https://abc123.ngrok.io)
```

## Verification Checklist

### ✅ Before User Joins
1. You can create a meeting: `npm run dev` → http://localhost:9002
2. See your name in participants list
3. Camera and microphone work
4. "Connected" toast appears

### ✅ When Another User Joins
1. They see your name in participant list
2. You see their name in your participant list
3. WebRTC offers sent to each user
4. Remote video appears (after peer connection)
5. Audio works for both

### ❌ If Issues Occur

**Problem: "getUserMedia is not available"**
- Solution: Ensure using HTTPS (localhost or ngrok) ✓

**Problem: "Not Secure" warning**
- Solution: Switch to localhost or ngrok ✓

**Problem: Names not showing in participants**
- This was fixed! Run: `npm run dev` to get latest code ✓

**Problem: Camera/mic blocked**
- Solution: Use localhost or ngrok HTTPS ✓
- Check browser permissions in settings

## Commands

### Start Development Server
```bash
npm run dev
# Opens: http://localhost:9002
```

### Run with HTTPS (for network without ngrok)
```bash
npm run dev:secure
# Attempts to use HTTPS with self-signed certificate
```

### Type Check
```bash
npm run typecheck
```

### Build for Production
```bash
npm run build
npm start
```

## Firebase Setup

Your app uses Firebase for:
- User authentication (signup/login)
- Meeting creation and storage
- Real-time signaling (WebRTC offer/answer/ICE)
- Participant list management

Ensure your `.env.local` has:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## For Production Deployment

Use a real HTTPS certificate:
1. Deploy to Vercel (automatic HTTPS)
2. Or use Let's Encrypt (free SSL) with your domain
3. Never use self-signed certificates in production

## Support

### Still Having Issues?
1. Check browser console (F12) for error messages
2. Ensure both users are authenticated with Firebase
3. Verify room ID is the same for both users
4. Check Firestore rules allow access to `/rooms` collection
5. Use ngrok for guaranteed HTTPS working

### Quick Debug
```bash
# Check server logs while running:
npm run dev

# Look for:
# - "[CallInterface] Initialization dependencies"
# - "[FirebaseSignaling] Registering presence"
# - "[CallInterface] Participants changed"
```

---

**TL;DR for Quick Multi-User Testing:**
1. Install ngrok
2. Run `npm run dev`
3. In new terminal: `ngrok http 9002`
4. Share ngrok HTTPS URL with other users
5. Both users create accounts and can now call each other!
