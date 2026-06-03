// app/api/admin/vercel-stats/route.ts

import { NextResponse } from 'next/server';

// Types
interface VercelDeployment {
  uid: string;
  name: string;
  state: 'BUILDING' | 'ERROR' | 'FAILED' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  created: number;
  readyState?: string;
  ready?: number;
  url: string;
  target?: 'production' | 'staging' | 'development';
}

interface VercelResponse {
  deployments: VercelDeployment[];
  pagination?: {
    count: number;
    next?: number;
  };
}

interface SimplifiedStats {
  totalDeployments: number;
  productionDeployments: number;
  stagingDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  lastSuccessfulDeployment: VercelDeployment | null;
  lastFailedDeployment: VercelDeployment | null;
  recentDeployments: VercelDeployment[];
}

// ============================================
// GET - Fetch Vercel deployment stats
// ============================================
export async function GET() {
  try {
    // Validate environment variables
    const projectId = process.env.VERCEL_PROJECT_ID;
    const apiToken = process.env.VERCEL_API_TOKEN;

    if (!projectId) {
      console.error('Missing VERCEL_PROJECT_ID environment variable');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing VERCEL_PROJECT_ID' },
        { status: 500 }
      );
    }

    if (!apiToken) {
      console.error('Missing VERCEL_API_TOKEN environment variable');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing VERCEL_API_TOKEN' },
        { status: 500 }
      );
    }

    // Fetch deployments from Vercel API
    const response = await fetch(
      `https://api.vercel.com/v1/projects/${projectId}/deployments?limit=50`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vercel API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Vercel API error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json() as VercelResponse;
    const deployments = data.deployments || [];

    if (deployments.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalDeployments: 0,
          productionDeployments: 0,
          stagingDeployments: 0,
          successfulDeployments: 0,
          failedDeployments: 0,
          lastSuccessfulDeployment: null,
          lastFailedDeployment: null,
          recentDeployments: []
        }
      });
    }

    // Calculate statistics
    const productionDeployments = deployments.filter(d => d.target === 'production');
    const stagingDeployments = deployments.filter(d => d.target === 'staging' || !d.target);
    const successfulDeployments = deployments.filter(d => d.state === 'READY');
    const failedDeployments = deployments.filter(d => d.state === 'ERROR' || d.state === 'FAILED' || d.state === 'CANCELED');
    
    const lastSuccessfulDeployment = successfulDeployments[0] || null;
    const lastFailedDeployment = failedDeployments[0] || null;

    const stats: SimplifiedStats = {
      totalDeployments: deployments.length,
      productionDeployments: productionDeployments.length,
      stagingDeployments: stagingDeployments.length,
      successfulDeployments: successfulDeployments.length,
      failedDeployments: failedDeployments.length,
      lastSuccessfulDeployment: lastSuccessfulDeployment,
      lastFailedDeployment: lastFailedDeployment,
      recentDeployments: deployments.slice(0, 10) // Last 10 deployments
    };

    return NextResponse.json({
      success: true,
      stats,
      raw: process.env.NODE_ENV === 'development' ? data : undefined // Only return raw data in development
    });

  } catch (error) {
    console.error('Error fetching Vercel stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Vercel deployment statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}