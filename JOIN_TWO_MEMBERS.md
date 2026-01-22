# Join Two Members from Different Desktops - Complete Guide

## Overview
This guide walks you through connecting two users on different computers into the same meeting with real names and video sharing.

## What You'll Need
- **Computer 1** (Your main computer): Running the application
- **Computer 2** (Another computer or same computer in different browser/incognito)
- **Both computers** on the same WiFi OR using ngrok tunnel for different networks
- **Developer Tools** open for monitoring (F12 → Console)

---

## STEP 1: Start the Server (Computer 1 ONLY)

The server should already be running. Verify it's working:

```powershell
# You should see output like:
# ✓ Ready in 3.6s
# ✓ Compiled /api/server-ip in 6.3s
# ✓ Local: http://localhost:9002
# ✓ Network: http://192.168.1.17:9002
```

**If server is NOT running:**
```powershell
cd "C:\Users\Dhruv Gupta\Downloads\Real-Time-Sign Language\Real-Time-Sign-Language"
npm run dev
```

---

## STEP 2: User 1 Sign Up & Create Meeting (Computer 1)

### 2.1 Open Browser on Computer 1
```
URL: http://localhost:9002
```

### 2.2 Open Developer Tools
- Press **F12**
- Click on **Console** tab
- Keep it visible throughout testing
- This shows you the detailed connection logs

### 2.3 Sign Up User 1
Click "Sign Up" and enter:
```
Email:          user1@test.com
Password:       Test@123
Confirm Password: Test@123
```
Click **Create Account**

### 2.4 You're Now Logged In
You should see:
- Dashboard with option to "Create Meeting"
- Click **Create Meeting**

### 2.5 Enter Meeting Details
```
Display Name: User1  ← This is what will show in participant list
```

You'll see your Room ID appear. **Note this ID down:**
```
Room ID: room_[randomstring]
```

### 2.6 Select User Mode
Choose one of:
- **Hearing** (for hearing users)
- **Deaf/Mute** (for deaf/mute users)

Verify:
- ✅ Camera preview shows your face
- ✅ Microphone input is working
- ✅ Audio output is working

### 2.7 Click "Join Now"
You should now see:
- Main video showing your camera
- Small PIP (Picture in Picture) showing yourself
- Console showing connection logs starting with `[CallInterface]`

**Monitor the Console:**
You should see these logs:
```
[CallInterface] Registering presence with name: User1
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
[FirebaseSignaling] ===== SETTING UP PARTICIPANTS LISTENER =====
```

✅ **If you see these, User 1 is successfully registered!**

---

## STEP 3: User 2 Setup on Computer 2

### 3.1 Choose Your Access Method

**OPTION A: Same WiFi (Easiest)**
```
Get your Computer 1's IP address from the server logs:
Network: http://192.168.1.17:9002  ← Use this IP

URL on Computer 2: http://192.168.1.17:9002
```

**OPTION B: Different Network (Use ngrok)**

On Computer 1, open a NEW terminal (not the one running the server):
```powershell
ngrok http 9002
```

You'll see:
```
Forwarding https://abc123def456.ngrok.io -> http://localhost:9002
```

Copy the HTTPS URL:
```
URL on Computer 2: https://abc123def456.ngrok.io
```

**OPTION C: Same Computer (Testing Only)**
```
Open an Incognito Window on Computer 1
URL: http://localhost:9002
```

### 3.2 Open Browser on Computer 2
- Use the URL from your chosen method above
- Press **F12** to open Developer Tools
- Click **Console** tab
- Keep it visible for monitoring

### 3.3 Sign Up User 2
Click "Sign Up" and enter:
```
Email:          user2@test.com
Password:       Test@123
Confirm Password: Test@123
```
Click **Create Account**

### 3.4 Join the Same Meeting
After login, you should see:
- List of available meetings
- Find the meeting created by User1 (should show in the list)
- Click to join it

### 3.5 Enter Meeting Details
```
Display Name: User2  ← This will show in User1's participant list
```

### 3.6 Select User Mode
Choose the opposite mode from User1:
- If User1 chose **Hearing** → Choose **Deaf/Mute**
- If User1 chose **Deaf/Mute** → Choose **Hearing**

Verify:
- ✅ Camera preview shows your face
- ✅ Microphone input is working

### 3.7 Click "Join Now"
Now you're in the meeting. **Check the Console immediately:**
```
[CallInterface] Registering presence with name: User2
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
```

✅ **If you see these, User 2 is successfully registered!**

---

## STEP 4: Verify Success ✅

### Check Computer 1 (User 1's Screen):

**In Browser:**
- [ ] Left sidebar shows **Participants** section
- [ ] Participants list shows:
  - "User1" (yourself)
  - **"User2"** (NOT "Unknown" ← This means names are working!)
- [ ] Main video shows User2's camera feed (not placeholder image)
- [ ] Can hear User2's voice

**In Console (F12):**
Watch for these logs:
```
[FirebaseSignaling] ===== PARTICIPANTS SNAPSHOT RECEIVED =====
[FirebaseSignaling] Total documents: 2
[FirebaseSignaling] Final participants list to callback: [{ id: '...', displayName: 'User2' }]

[CallInterface] Creating peer connection for: [userId] User2
[CallInterface] Remote stream received from: [userId]
[CallInterface] Remote stream video tracks: 1
[CallInterface] Remote stream audio tracks: 1
```

### Check Computer 2 (User 2's Screen):

**In Browser:**
- [ ] Participants list shows:
  - "User2" (yourself)
  - **"User1"** (NOT "Unknown" ← Names working!)
- [ ] Main video shows User1's camera feed
- [ ] Can hear User1's voice

**In Console (F12):**
Watch for similar logs showing User1 connection

---

## STEP 5: Test Communication ✅

### Audio Test:
- User1 speaks → User2 should hear
- User2 speaks → User1 should hear

### Video Test:
- Both should see each other's live camera feed
- NOT placeholder images

### Names Test:
- Both should see real names in participant list
- NOT "Unknown"

---

## What Each Part Does

### Participant List (Shows Names)
Located in the left sidebar under "👥 Participants"

**Expected:**
```
User1 (you)
User2 (remote user)
```

**If shows "Unknown" instead of real names:**
→ See troubleshooting section below

### Main Video (Real-Time Sharing)
The large video in the center of the screen

**Expected:**
- Shows the other person's camera in full HD
- Not the placeholder image

**If shows placeholder image:**
→ Video connection not established yet or failed

---

## Console Log Quick Reference

### ✅ SUCCESS Logs (What You Want)

```javascript
// Names registered successfully
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====

// Other users detected
[FirebaseSignaling] ===== PARTICIPANTS SNAPSHOT RECEIVED =====
[FirebaseSignaling] Total documents: 2

// Names correctly shown
[FirebaseSignaling] Final participants list to callback: [{ id: 'user2Id', displayName: 'User2' }]

// Video connection established
[CallInterface] Remote stream received from: user2Id
[CallInterface] Remote stream video tracks: 1
[CallInterface] Remote stream audio tracks: 1
```

### ❌ ERROR Logs (Troubleshooting)

```javascript
// Names NOT saved
[FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY ===== FALSE

// Other users not detected
[FirebaseSignaling] Total documents: 0
[FirebaseSignaling] Final participants list to callback: []

// No video tracks
[CallInterface] Remote stream video tracks: 0

// Connection errors
[FirebaseSignaling] Error registering presence: permission denied
Error: NotAllowedError: Permission denied  // Camera/mic blocked
```

---

## Troubleshooting

### Problem 1: Names Show "Unknown" Instead of Real Names

**Cause:** Display name not being saved to Firestore

**Fix:**
1. Go back and check you entered the display name correctly
2. Clear browser cache (Ctrl+Shift+Delete)
3. Sign out and sign back in
4. Make sure you see `PRESENCE REGISTERED SUCCESSFULLY` in console
5. Check Firestore console to verify data is saved

### Problem 2: Can't Access From Computer 2

**If using same WiFi:**
- Verify IP address is correct from server logs
- Check firewall allows port 9002
- Try disabling firewall temporarily

**If using ngrok:**
- Verify ngrok tunnel is still running
- URL expires after 2 hours - generate new one if needed
- Check HTTPS URL (not HTTP)

**If same computer:**
- Use Incognito window to avoid cache issues
- Make sure you're on different browser tabs/windows

### Problem 3: Video Shows Placeholder (Not Real Video)

**Cause:** Peer connection not established

**Fix:**
1. Check console for `Remote stream received from:` log
2. If missing: Offer/answer not exchanging properly
3. Check both users are in same room
4. Check `Local stream available: true` appears in logs
5. Wait up to 30 seconds (connection can take time)

### Problem 4: Camera/Microphone Blocked

**Error message:**
```
NotAllowedError: Permission denied by system
```

**Fix:**
1. Look for camera icon in browser address bar
2. Click it and select "Allow"
3. Reload page (F5)
4. Try joining meeting again

### Problem 5: No Console Logs Appearing

**Fix:**
1. Clear console (trash icon)
2. Reload page (F5)
3. Watch IMMEDIATELY for logs
4. If nothing: Check JavaScript isn't disabled
5. Try opening in different browser

---

## Manual Verification in Firebase Console

To double-check names are being saved:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `studio-483967676-63ce6`
3. Go to **Firestore Database**
4. Navigate to: `rooms` → click your room ID → `participants`
5. You should see 2 documents:
   ```
   Document 1:
   - userId: "user1Id"
   - displayName: "User1"
   
   Document 2:
   - userId: "user2Id"
   - displayName: "User2"
   ```

If documents are missing → Data not being saved → Permission issue

---

## Testing Checklist (Printable)

Use this checklist while testing:

### Pre-Test
- [ ] Server running on Computer 1
- [ ] Both computers connected to same network (or ngrok tunnel ready)
- [ ] Both browsers have F12 Developer Tools open
- [ ] Console tabs are visible and cleared

### User 1 Setup
- [ ] Signed up with user1@test.com
- [ ] Entered display name: **User1**
- [ ] Selected user mode
- [ ] Clicked "Join Now"
- [ ] See logs: `PRESENCE REGISTERED SUCCESSFULLY`
- [ ] See logs: `SETTING UP PARTICIPANTS LISTENER`
- [ ] Waiting for User2...

### User 2 Setup
- [ ] Signed up with user2@test.com
- [ ] Entered display name: **User2**
- [ ] Joined SAME meeting as User1
- [ ] Selected opposite user mode
- [ ] Clicked "Join Now"
- [ ] See logs: `PRESENCE REGISTERED SUCCESSFULLY`

### Verification
- [ ] User1 sees "User2" in participant list (not "Unknown")
- [ ] User2 sees "User1" in participant list (not "Unknown")
- [ ] User1 sees User2's live video (not placeholder)
- [ ] User2 sees User1's live video (not placeholder)
- [ ] User1 can hear User2
- [ ] User2 can hear User1
- [ ] No red errors in console
- [ ] All expected logs appear

### Success!
- [ ] Both users connected with names and video
- [ ] Ready for production testing

---

## Tips for Success

1. **Start Simple**: Test on same WiFi before trying remote access
2. **Check Logs First**: Console logs tell you exactly what's working
3. **Give it Time**: First connection can take 10-15 seconds
4. **Use Exact Names**: Make sure display names are "User1" and "User2" exactly
5. **Keep Console Visible**: Watch logs as you join
6. **One Room at a Time**: Don't create multiple rooms, join the same one
7. **Clear Cache**: If something doesn't work, clear browser cache

---

## Next Steps After Success

Once the two-user test passes:
1. ✅ Test with 3rd user
2. ✅ Test audio/video toggle buttons
3. ✅ Test with different internet speeds
4. ✅ Test with other user modes
5. ✅ Deploy to production

---

## Support

If you get stuck:
1. Check the **Console Logs** section above - your issue is likely documented
2. Look at **Troubleshooting** section with matching problem
3. Verify **Manual Verification in Firebase Console** shows data is saved
4. Check that you followed **STEP 1-5** in order

Good luck! 🎉
