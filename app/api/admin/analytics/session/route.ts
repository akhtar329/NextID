// app/api/analytics/session/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('🔄 Session update received:', data);
    
    // Temporary success response
    return NextResponse.json({ 
      success: true,
      message: 'Session updated successfully (mock)'
    });
    
  } catch (error) {
    console.error('❌ Session update error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}