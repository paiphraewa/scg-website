// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    const user = await verifyUser(email, password)
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user 
      }
    )
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 401 }
    )
  }
}