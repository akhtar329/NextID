// app/api/admin/redirects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { redirects as initialRedirects } from '@/services/redirects-config';
import fs from 'fs';
import path from 'path';

// Types
interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

interface SaveRedirectsBody {
  redirects: RedirectRule[];
}

// In-memory storage for runtime change
let currentRedirects: RedirectRule[] = [...initialRedirects];

// Path to the config file
const getConfigPath = (): string => {
  // Try multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'services', 'redirects-config.ts'),
    path.join(process.cwd(), 'app', 'lib', 'redirects-config.ts'),
    path.join(process.cwd(), 'lib', 'redirects-config.ts'),
    path.join(process.cwd(), 'src', 'services', 'redirects-config.ts'),
    path.join(process.cwd(), 'src', 'lib', 'redirects-config.ts'),
  ];
  
  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  
  // Default path
  return path.join(process.cwd(), 'services', 'redirects-config.ts');
};

// Generate config file content
function generateConfigContent(redirects: RedirectRule[]): string {
  return `// Auto-generated redirects config - DO NOT EDIT MANUALLY
// Last updated: ${new Date().toISOString()}

export interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

export const redirects: RedirectRule[] = ${JSON.stringify(redirects, null, 2)};

export function getRedirect(fromPath: string): RedirectRule | undefined {
  // Check exact match first
  const exactMatch = redirects.find(r => r.from === fromPath);
  if (exactMatch) return exactMatch;
  
  // Check pattern matches (wildcard *)
  const patternMatch = redirects.find(r => {
    if (r.from.includes('*')) {
      const pattern = r.from.replace(/\\*/g, '.*');
      const regex = new RegExp(\`^\${pattern}$\`);
      return regex.test(fromPath);
    }
    return false;
  });
  
  return patternMatch;
}

// Helper to check if a path is a redirect
export function isRedirectPath(path: string): boolean {
  return redirects.some(r => {
    if (r.from === path) return true;
    if (r.from.includes('*')) {
      const pattern = r.from.replace(/\\*/g, '.*');
      const regex = new RegExp(\`^\${pattern}$\`);
      return regex.test(path);
    }
    return false;
  });
}

// Helper to get redirect target
export function getRedirectTarget(fromPath: string): string | null {
  const redirect = getRedirect(fromPath);
  return redirect ? redirect.to : null;
}`;
}

// ============================================
// GET - Fetch all redirects
// ============================================
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: currentRedirects
    });
  } catch (error) {
    console.error('GET redirects error:', error);
    return NextResponse.json({ 
      success: true, 
      data: [] 
    });
  }
}

// ============================================
// POST - Save redirects
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SaveRedirectsBody;
    const { redirects } = body;
    
    // Validate data
    if (!Array.isArray(redirects)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format: expected array' },
        { status: 400 }
      );
    }
    
    // Validate each redirect rule
    for (const rule of redirects) {
      if (!rule.from || typeof rule.from !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid redirect: missing or invalid "from" field' },
          { status: 400 }
        );
      }
      if (!rule.to || typeof rule.to !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid redirect: missing or invalid "to" field' },
          { status: 400 }
        );
      }
      if (rule.status !== 301 && rule.status !== 302) {
        return NextResponse.json(
          { success: false, error: 'Invalid redirect: status must be 301 or 302' },
          { status: 400 }
        );
      }
    }
    
    // Check for duplicate from paths
    const fromPaths = redirects.map(r => r.from);
    const duplicates = fromPaths.filter((path, index) => fromPaths.indexOf(path) !== index);
    if (duplicates.length > 0) {
      return NextResponse.json(
        { success: false, error: `Duplicate redirect paths: ${duplicates.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Update in-memory
    currentRedirects = redirects;
    
    // Update the TypeScript file (optional, for persistence)
    try {
      const configPath = getConfigPath();
      const content = generateConfigContent(redirects);
      fs.writeFileSync(configPath, content, 'utf-8');
      console.log(`✅ Redirects saved to ${configPath}`);
    } catch (fileError) {
      // File write error - log but don't fail the request
      console.error('Failed to write redirects config file:', fileError);
      // Still return success since memory is updated
    }
    
    return NextResponse.json({
      success: true,
      message: `${redirects.length} redirects saved successfully`,
      count: redirects.length
    });
    
  } catch (error) {
    console.error('POST redirects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save redirects' },
      { status: 500 }
    );
  }
}