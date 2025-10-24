// lib/auth-utils.ts
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function registerUser(name: string, email: string, password: string, phone?: string) {
  try {
    console.log('Registering user:', email);
    
    // Validate input
    if (!name || !email || !password) {
      throw new Error('All fields are required')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    console.log('User registered successfully:', user.id);
    return { id: user.id, name: user.name, email: user.email}
    
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export async function verifyUser(email: string, password: string) {
  try {
    console.log('Verifying user:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      throw new Error('Invalid email or password')
    }

    const passwordValid = await bcrypt.compare(password, user.password)

    if (!passwordValid) {
      throw new Error('Invalid email or password')
    }

    console.log('User verified successfully:', user.id);
    return { id: user.id, name: user.name, email: user.email }
    
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}