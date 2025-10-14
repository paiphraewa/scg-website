// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json()
    
    const user = await registerUser(name, email, password, phone)
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Account created successfully',
        user 
      },
      { status: 201 }
    )
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 400 }
    )
  }
}