// app/api/admin/check-auth/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('authToken')?.value;
    
    if (!authToken) {
      return NextResponse.json({ authenticated: false });
    }
    
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not set');
      return NextResponse.json({ authenticated: false });
    }
    
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as { 
        id: number; 
        email: string; 
        name: string; 
        role: string 
      };
      
      return NextResponse.json({ 
        authenticated: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        }
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false });
  }
}