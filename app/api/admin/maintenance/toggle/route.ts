// app/api/admin/maintenance/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ✅ Fixed: Use const instead of let (not reassigned)
const maintenanceState = {
  isEnabled: process.env.MAINTENANCE_MODE === 'true',
};

export async function POST(request: NextRequest) {
  try {
    const { enabled } = await request.json();
    
    maintenanceState.isEnabled = enabled;
    
    // Update .env.local file
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('MAINTENANCE_MODE=')) {
        envContent = envContent.replace(
          /MAINTENANCE_MODE=.*/,
          `MAINTENANCE_MODE=${enabled}`
        );
      } else {
        envContent += `\nMAINTENANCE_MODE=${enabled}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      process.env.MAINTENANCE_MODE = enabled ? 'true' : 'false';
      
    } catch {
      // Silent fail - file write error
    }
    
    return NextResponse.json({
      success: true,
      message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
      isEnabled: enabled,
    });
    
  } catch {
    return NextResponse.json(
      { error: 'Failed to toggle maintenance mode' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    isEnabled: maintenanceState.isEnabled,
  });
}
