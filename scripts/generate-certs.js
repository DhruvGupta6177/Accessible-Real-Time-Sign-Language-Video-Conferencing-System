const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

const certsDir = path.join(__dirname, '../certs');
const certFile = path.join(certsDir, 'cert.pem');
const keyFile = path.join(certsDir, 'key.pem');

// Ensure certs directory exists
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Check if certificates already exist
if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  console.log('✓ Certificates already exist');
  process.exit(0);
}

console.log('Generating self-signed certificates...');

// Get local IP
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.1.1';
};

const localIP = getLocalIP();

// OpenSSL command to generate self-signed certificate
const opensslCmd = `openssl req -x509 -newkey rsa:2048 -keyout "${keyFile}" -out "${certFile}" -days 365 -nodes -subj "/CN=localhost/subjectAltName=DNS:localhost,DNS:127.0.0.1,DNS:${localIP},IP:127.0.0.1,IP:${localIP}"`;

console.log(`Generating certificate for: localhost, ${localIP}`);

exec(opensslCmd, (error, stdout, stderr) => {
  if (error) {
    console.error('Error generating certificates:', error.message);
    console.error('Attempting alternative method using Node.js...');
    generateWithNodeCrypto();
    return;
  }

  console.log('✓ Certificates generated successfully');
  console.log(`Certificate: ${certFile}`);
  console.log(`Private Key: ${keyFile}`);
});

function generateWithNodeCrypto() {
  try {
    const pem = require('pem');
    pem.createCertificate({ days: 365, selfSigned: true }, (err, keys) => {
      if (err) {
        console.error('Failed to generate certificates:', err);
        process.exit(1);
      }

      fs.writeFileSync(certFile, keys.certificate);
      fs.writeFileSync(keyFile, keys.serviceKey);
      console.log('✓ Certificates generated successfully with Node.js');
      console.log(`Certificate: ${certFile}`);
      console.log(`Private Key: ${keyFile}`);
    });
  } catch (e) {
    console.error('PEM module not found. Please install OpenSSL manually or run:');
    console.error('npm install pem');
    process.exit(1);
  }
}
