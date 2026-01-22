# HTTPS Setup for Network Access

## Problem

When accessing the app via network IP (e.g., `http://192.168.1.17:9002`), the browser shows "Not Secure" warnings. This prevents camera and microphone access because browsers require a **secure context** (HTTPS) for `getUserMedia()`.

## Solutions

### Option 1: Use Localhost (Simplest - Recommended for Testing)
Even when developing on the network, access the app via localhost:
- **Your computer**: `http://localhost:9002`
- **Other devices on network**: Use the `--hostname 0.0.0.0` flag in next.config.ts AND access via `http://localhost:9002` from your machine, then share the same network connection

**This works because localhost is treated as a secure context by browsers.**

### Option 2: Enable HTTPS with Self-Signed Certificate (For Network Testing)

#### Step 1: Generate Self-Signed Certificate

Run these PowerShell commands (as Administrator):

```powershell
# Create a certificate for 5 years
$cert = New-SelfSignedCertificate -DnsName "192.168.1.17", "localhost", "127.0.0.1" -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(5)

# Export to PFX file
$pwd = ConvertTo-SecureString -String "your-password-here" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "C:\Users\Dhruv Gupta\Downloads\Real-Time-Sign Language\Real-Time-Sign-Language\server.pfx" -Password $pwd
```

#### Step 2: Create HTTPS Server

Create [src/server.ts](src/server.ts):

```typescript
import https from 'https';
import fs from 'fs';
import path from 'path';

const app = require('next').default;
const handle = app.getRequestHandler();

const dev = process.env.NODE_ENV !== 'production';
const nextApp = app({ dev });

nextApp.prepare().then(() => {
  const certPath = path.join(process.cwd(), 'server.pfx');
  const certPassword = process.env.CERT_PASSWORD || 'your-password-here';

  const options = {
    pfx: fs.readFileSync(certPath),
    passphrase: certPassword,
  };

  https
    .createServer(options, (req, res) => handle(req, res))
    .listen(9002, '0.0.0.0', () => {
      console.log('HTTPS Server running at https://192.168.1.17:9002');
    });
});
```

#### Step 3: Update package.json

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "dev:https": "node src/server.ts"
  }
}
```

#### Step 4: Add Certificate to Browser Trust

1. Open `server.pfx` in your browser's certificate manager
2. Import as trusted certificate
3. Or access `https://192.168.1.17:9002` and click through the security warning

### Option 3: Use ngrok for Quick Network Tunneling

```bash
# Install ngrok from https://ngrok.com
ngrok http 9002
# Provides HTTPS URL like: https://abc123.ngrok.io
```

## Environment Variable

If using HTTPS with certificate, add to `.env.local`:

```
CERT_PASSWORD=your-password-here
```

## Testing the Connection

Once HTTPS is working:

1. Access via network IP: `https://192.168.1.17:9002`
2. Browser should allow camera/microphone access
3. Both users should see "Connected" toast message

## Troubleshooting

- **Still seeing "Not Secure"**: Browser didn't trust the certificate. Re-import it or use a certificate authority.
- **Camera/Mic still blocked**: Clear browser cache and reload. Some browsers cache permission denials.
- **Connection fails with certificate error**: Ensure certificate includes your network IP address in DNS names.

## Production Deployment

For production, use a real SSL certificate from Let's Encrypt (free) or other providers. Never use self-signed certificates in production.
