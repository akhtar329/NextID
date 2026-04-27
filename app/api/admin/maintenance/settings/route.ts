// app/api/admin/maintenance/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In-memory store
let maintenanceConfig = {
  isEnabled: process.env.MAINTENANCE_MODE === 'true',
  title: process.env.MAINTENANCE_TITLE || 'Site Under Maintenance',
  message: process.env.MAINTENANCE_MESSAGE || 'We are currently performing scheduled maintenance. Please check back soon.',
  estimatedTime: process.env.MAINTENANCE_ESTIMATED_TIME || '2 hours',
  allowIps: process.env.MAINTENANCE_ALLOW_IPS?.split(',') || [],
};

export async function GET() {
  return NextResponse.json({
    success: true,
    data: maintenanceConfig,
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Saving settings:', body); // Debug
    
    // Update in-memory
    if (body.title !== undefined) maintenanceConfig.title = body.title;
    if (body.message !== undefined) maintenanceConfig.message = body.message;
    if (body.estimatedTime !== undefined) maintenanceConfig.estimatedTime = body.estimatedTime;
    
    // Update .env.local file
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update or add each variable
      const updates = [
        { key: 'MAINTENANCE_TITLE', value: maintenanceConfig.title },
        { key: 'MAINTENANCE_MESSAGE', value: maintenanceConfig.message },
        { key: 'MAINTENANCE_ESTIMATED_TIME', value: maintenanceConfig.estimatedTime },
      ];
      
      for (const { key, value } of updates) {
        if (envContent.includes(`${key}=`)) {
          envContent = envContent.replace(
            new RegExp(`${key}=.*`),
            `${key}=${value}`
          );
        } else {
          envContent += `\n${key}=${value}`;
        }
      }
      
      fs.writeFileSync(envPath, envContent);
      
      // Update process.env
      process.env.MAINTENANCE_TITLE = maintenanceConfig.title;
      process.env.MAINTENANCE_MESSAGE = maintenanceConfig.message;
      process.env.MAINTENANCE_ESTIMATED_TIME = maintenanceConfig.estimatedTime;
      
      console.log('.env file updated successfully');
      
    } catch (fileError) {
      console.error('Could not update .env file:', fileError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
