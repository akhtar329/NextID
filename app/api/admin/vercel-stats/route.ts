// app/api/admin/vercel-stats/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch(
    'https://api.vercel.com/v1/projects/' + process.env.VERCEL_PROJECT_ID + '/deployments',
    { headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` } }
  );
  const data = await response.json();
  return NextResponse.json({ stats: data });
}