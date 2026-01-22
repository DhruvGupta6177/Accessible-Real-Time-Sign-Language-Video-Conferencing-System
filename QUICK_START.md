# ⚡ QUICK START - Join 2 Members in 5 Steps

## 🖥️ STEP 1: COMPUTER 1 SETUP (5 minutes)

### Open Browser
```
http://localhost:9002
```

### Press F12 (Open Developer Tools)
- Click "Console" tab
- Keep it visible

### Sign Up
```
Email:    user1@test.com
Password: Test@123
```

### Create Meeting
- Click "Create Meeting"
- Enter Display Name: **User1**
- Note the Room ID shown
- Select Mode: Hearing or Deaf/Mute
- Verify camera shows your face ✓
- Click "Join Now"

### Check Console
Look for:
```
✅ [FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
```

---

## 💻 STEP 2: COMPUTER 2 SETUP (5 minutes)

### Choose URL (Pick ONE):

**Same WiFi:**
```
http://192.168.1.17:9002
(Replace IP from Computer 1 server logs)
```

**Different Network (use ngrok):**
1. Open new terminal on Computer 1
2. Run: `ngrok http 9002`
3. Copy HTTPS URL: `https://abc123.ngrok.io`

**Same Computer:**
```
Open Incognito Window
http://localhost:9002
```

### Press F12 (Open Developer Tools)
- Click "Console" tab
- Keep it visible

### Sign Up
```
Email:    user2@test.com
Password: Test@123
```

### Join Meeting
- Click the meeting from User1
- Enter Display Name: **User2**
- Select OPPOSITE Mode (if User1 chose Hearing, choose Deaf/Mute)
- Verify camera shows your face ✓
- Click "Join Now"

### Check Console
Look for:
```
✅ [FirebaseSignaling] ===== PRESENCE REGISTERED SUCCESSFULLY =====
```

---

## ✅ STEP 3: VERIFY ON COMPUTER 1

### In Browser Window:
- [ ] Participants list shows "User1" (you) and **"User2"** (NOT "Unknown")
- [ ] Main video shows User2's camera (NOT placeholder image)
- [ ] Can hear User2's voice

### In Console (F12):
- [ ] See logs: `PARTICIPANTS SNAPSHOT RECEIVED`
- [ ] See logs: `Remote stream received from:`
- [ ] See logs: `Remote stream video tracks: 1`
- [ ] See logs: `Remote stream audio tracks: 1`
- [ ] NO red errors

**✅ If all checked: NAMES AND VIDEO ARE WORKING!**

---

## ✅ STEP 4: VERIFY ON COMPUTER 2

### In Browser Window:
- [ ] Participants list shows "User2" (you) and **"User1"** (NOT "Unknown")
- [ ] Main video shows User1's camera (NOT placeholder image)
- [ ] Can hear User1's voice

### In Console (F12):
- [ ] See logs: `PARTICIPANTS SNAPSHOT RECEIVED`
- [ ] See logs: `Remote stream received from:`
- [ ] See logs: `Remote stream video tracks: 1`
- [ ] See logs: `Remote stream audio tracks: 1`
- [ ] NO red errors

**✅ If all checked: TWO-WAY CONNECTION SUCCESSFUL!**

---

## 🎯 STEP 5: TEST COMMUNICATION

### Audio ✓
- [ ] User1 speaks → User2 hears
- [ ] User2 speaks → User1 hears

### Video ✓
- [ ] User1 sees User2's live camera
- [ ] User2 sees User1's live camera

### Names ✓
- [ ] Both participant lists show real names
- [ ] Not "Unknown"

---

## 🆘 IF IT DOESN'T WORK

### Names Show "Unknown"
```
1. Close both browser windows
2. Clear browser cache (Ctrl+Shift+Delete)
3. Start over from Step 1
4. Make sure you type display name correctly
5. Check console for: PRESENCE REGISTERED SUCCESSFULLY
```

### No Video (Shows Placeholder)
```
1. Wait 10-15 seconds (connection takes time)
2. Check console for: "Remote stream received"
3. If not there: Video connection failed
4. Try closing and joining again
```

### Can't Connect from Computer 2
```
If using WiFi:
- Check IP address is correct
- Try: ipconfig /all (on Computer 1 to find IP)
- Check firewall allows port 9002

If using ngrok:
- Make sure ngrok terminal is still running
- Generate new URL (expires after 2 hours)
- Use HTTPS URL, not HTTP
```

### Camera Blocked
```
1. Look for camera icon in address bar
2. Click and select "Allow"
3. Reload page (F5)
4. Try again
```

---

## 📊 SUCCESS CHECKLIST

Print this and check off as you go:

```
🖥️  COMPUTER 1
├─ [ ] Browser open: http://localhost:9002
├─ [ ] Signed up: user1@test.com
├─ [ ] Display Name: User1
├─ [ ] Created/joined meeting
├─ [ ] Selected mode (Hearing/Deaf)
├─ [ ] Clicked "Join Now"
├─ [ ] Console shows "PRESENCE REGISTERED SUCCESSFULLY"
└─ [ ] Waiting for User2...

💻 COMPUTER 2
├─ [ ] Browser open: http://192.168.1.17:9002 (or ngrok URL)
├─ [ ] Signed up: user2@test.com
├─ [ ] Display Name: User2
├─ [ ] Joined SAME meeting as User1
├─ [ ] Selected opposite mode
├─ [ ] Clicked "Join Now"
└─ [ ] Console shows "PRESENCE REGISTERED SUCCESSFULLY"

✅ VERIFICATION
├─ [ ] Both see real names (not "Unknown")
├─ [ ] Both see live video (not placeholder)
├─ [ ] Both hear audio
├─ [ ] No console errors
└─ [ ] All expected logs appear

🎉 SUCCESS!
```

---

## ⏱️ Time Estimate
- Setup: 10 minutes
- Connection: 5-10 seconds
- **Total**: 15 minutes to full success

---

## 🎬 Ready?

1. Start with STEP 1 on Computer 1
2. Then STEP 2 on Computer 2
3. Check STEP 3 & 4 for verification
4. Test in STEP 5

**Expected Result:** Two users in the same meeting with real names and video! 🎉

---

**FULL GUIDE:** See `JOIN_TWO_MEMBERS.md` for detailed instructions and troubleshooting
