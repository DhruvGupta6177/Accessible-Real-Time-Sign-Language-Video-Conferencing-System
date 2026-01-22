#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

// For now, run on HTTP - HTTPS will be handled by ngrok
const port = 9002;

console.log('📱 Starting development server...\n');

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
  return 'unknown';
};

const localIP = getLocalIP();

// Start Next.js dev server
const nextServer = spawn('npx', ['next', 'dev', '--turbopack', '-p', port], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

nextServer.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

console.log('\n✅ Development Server running on:');
console.log(`   http://localhost:${port}`);
console.log(`   http://${localIP}:${port}\n`);

console.log('🔒 For HTTPS access on network (if browser blocks camera/mic):');
console.log('   1. Install ngrok from https://ngrok.com');
console.log('   2. Run: ngrok http 9002');
console.log('   3. Use the HTTPS URL provided by ngrok\n');

console.log('Press Ctrl+C to stop\n');

process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  nextServer.kill();
  process.exit(0);
});

