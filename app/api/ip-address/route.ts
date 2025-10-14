// app/api/ip-address/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const ip = request.ip || 
                request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 
                'Unknown';
    
    return NextResponse.json({ ip });
  } catch (error) {
    return NextResponse.json({ ip: 'Unknown' });
  }
}