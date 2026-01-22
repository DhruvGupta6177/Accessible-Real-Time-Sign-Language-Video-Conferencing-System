# Debugging "Could not connect to the room" Error

## Root Cause Analysis

The error "Could not connect to the room. Please try again" occurs during the `registerPresence()` call in `FirebaseSignalingService`. This can happen for several reasons:

## Common Causes (in order of likelihood)

### 1. **Firestore Rules Not Deployed** ⚠️ MOST LIKELY
**Issue:** You modified the firestore.rules file but haven't deployed it to Firebase.

**How to fix:**
```bash
# In project root directory
firebase deploy --only firestore:rules
```

**Verify:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (studio-483967676-63ce6)
3. Go to Firestore Database → Rules
4. Check if the `/rooms/{roomId}` rules are there

**Expected Rules:**
```
match /rooms/{roomId} {
  allow get, list: if isSignedIn();
  match /participants/{userId} {
    allow write: if isSignedIn() && request.auth.uid == userId;
  }
  match /messages/{messageId} {
    allow read: if isSignedIn();
  }
}
```

### 2. **User Not Authenticated**
**Issue:** `user` is null when trying to create FirebaseSignalingService

**Debug Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for log:
   ```
   [CallInterface] Initialization dependencies: { user: null, ... }
   ```
4. If user is null, the user authentication isn't complete

**How to fix:**
- Ensure you're logged in (login/signup page should work)
- Check if Firebase Auth is properly configured
- Look for auth errors in console

### 3. **Firebase Services Not Available**
**Issue:** `firestore` or `auth` is null/undefined

**Debug Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for log:
   ```
   [CallInterface] Initialization dependencies: { firestore: null, auth: null, ... }
   ```

**How to fix:**
- Check if FirebaseClientProvider is wrapping all components
- Verify Firebase config in `src/firebase/config.ts` has correct values
- Clear browser cache and reload

## How to Debug

### Step 1: Enable Detailed Console Logging
The code now includes detailed console logs. Open browser DevTools and look for:

```
[CallInterface] Initialization dependencies: {...}
[CallInterface] Creating FirebaseSignalingService with: {...}
[FirebaseSignaling] Initializing with userId: ...
[FirebaseSignaling] Registering presence for user: ... in room: ...
```

### Step 2: Check Each Log
1. **If you see:** `user: null` → User authentication issue
2. **If you see:** `firestore: null` or `auth: null` → Firebase services issue
3. **If you see all available** → Firestore rules issue (permission denied)

### Step 3: Check Network Tab (DevTools)
1. Open DevTools → Network tab
2. Filter by "firestore" or look for failed requests
3. Look for 403 (Permission Denied) errors
   - This means rules aren't set correctly

### Step 4: Check Firestore Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project: studio-483967676-63ce6
3. Firestore Database → Rules
4. Check if your new rules for `/rooms/{roomId}` are there

## Exact Error Messages and Solutions

### Error: "User must be authenticated to use FirebaseSignalingService"
```
[FirebaseSignaling] Error: User must be authenticated to use FirebaseSignalingService
```
**Solution:** User is logged out or authentication failed. Login again.

### Error: "Permission denied" (403 from Firestore)
```
[FirebaseSignaling] Error registering presence: FirebaseError: Missing or insufficient permissions
```
**Solution:** Deploy firestore rules:
```bash
firebase deploy --only firestore:rules
```

### Error: "Cannot read property 'uid' of null"
```
[CallInterface] Initialization dependencies: { user: null, ... }
```
**Solution:** Wait for authentication to complete, or sign in again.

## Complete Debugging Workflow

### For Windows PowerShell:

```powershell
# 1. Navigate to project
cd "c:\Users\Dhruv Gupta\Downloads\Real-Time-Sign Language\Real-Time-Sign-Language"

# 2. Deploy Firestore rules
firebase deploy --only firestore:rules

# 3. Check deployment status
firebase deploy --only firestore:rules --dry-run

# 4. Start dev server
npm run dev
```

### For All Users (Firebase CLI):

```bash
# 1. List available projects
firebase projects:list

# 2. Set correct project
firebase use studio-483967676-63ce6

# 3. Check current rules (view only)
firebase firestore:indexes

# 4. Deploy rules
firebase deploy --only firestore:rules

# 5. Verify rules deployed
firebase firestore:indexes
```

## Testing Checklist

After deploying rules, test in this order:

```
[ ] 1. Restart dev server (npm run dev)
[ ] 2. Clear browser cache (Ctrl+Shift+Delete)
[ ] 3. Open http://localhost:9002
[ ] 4. Sign in with valid credentials
[ ] 5. Click "Create New Meeting"
      [ ] Should NOT see "Could not connect" error
      [ ] Should see "Connected" toast
[ ] 6. Copy the invite link
[ ] 7. Open in another browser
      [ ] Enter room ID or use link
      [ ] Should connect without error
```

## If Still Getting Error

### Advanced Debugging

1. **Check Firestore Collection Exists**
   - Go to Firebase Console → Firestore
   - Manually create a document:
     - Collection: `rooms`
     - Document ID: `test-room-123`
     - Field: `test: "value"`
   - If you get permission error → Rules are definitely the issue

2. **Check Authentication**
   - Go to Firebase Console → Authentication
   - Verify your user account exists
   - Check if it's enabled (not disabled)

3. **Test Direct Write**
   - Open browser console and run:
   ```javascript
   const { getFirestore, collection, addDoc } = await import('firebase/firestore');
   const db = getFirestore();
   await addDoc(collection(db, 'rooms/test/participants'), {
     userId: 'test',
     status: 'online'
   }).catch(e => console.error(e));
   ```

## Firestore Rules Deployment Status

**Current Status:** Rules file updated at `firestore.rules`

**To Deploy:**
```bash
firebase deploy --only firestore:rules
```

**Rules Content (as of Jan 21, 2026):**
- ✅ `/users/{userId}` - User data isolation
- ✅ `/rooms/{roomId}/participants/{userId}` - Presence registration
- ✅ `/rooms/{roomId}/messages/{messageId}` - Signaling messages

## Contact & Support

If you still see the error after:
1. Deploying rules
2. Clearing cache
3. Restarting dev server

Please provide:
1. Full error from console
2. Screenshot of console logs
3. Firebase project ID
4. User email used for testing
