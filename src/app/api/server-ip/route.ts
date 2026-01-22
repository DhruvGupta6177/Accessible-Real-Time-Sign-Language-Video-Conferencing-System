import os from 'os';
import { NextResponse } from 'next/server';

export async function GET() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const netInfo = nets[name];
    if (!netInfo) continue;
    for (const net of netInfo) {
      // prefer IPv4, non-internal addresses
      if ((net.family === 'IPv4' || (net.family as any) === 4) && !net.internal) {
        return NextResponse.json({ ip: net.address });
      }
    }
  }
  return NextResponse.json({ ip: 'localhost' });
}
