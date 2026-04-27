// app/api/admin/redirects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redirects as initialRedirects } from '@/app/lib/redirects-config';
import fs from 'fs';
import path from 'path';

// In-memory storage for runtime changes
let currentRedirects = [...initialRedirects];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: currentRedirects
    });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { redirects } = await request.json();
    
    if (!Array.isArray(redirects)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }
    
    // Update in-memory
    currentRedirects = redirects;
    
    // Optional: Also update the TypeScript file
    try {
      const configPath = path.join(process.cwd(), 'app', 'lib', 'redirects-config.ts');
      const content = `export interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

export const redirects: RedirectRule[] = ${JSON.stringify(redirects, null, 2)};

export function getRedirect(fromPath: string): RedirectRule | undefined {
  const exactMatch = redirects.find(r => r.from === fromPath);
  if (exactMatch) return exactMatch;
  
  const patternMatch = redirects.find(r => {
    if (r.from.includes('*')) {
      const pattern = r.from.replace('*', '.*');
      return new RegExp(\`^\${pattern}$\`).test(fromPath);
    }
    return false;
  });
  
  return patternMatch;
}`;
      fs.writeFileSync(configPath, content);
    } catch {
      // Silent fail - file write error, but memory is updated
    }
    
    return NextResponse.json({
      success: true,
      message: `${redirects.length} redirects saved successfully`
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save redirects' },
      { status: 500 }
    );
  }
}