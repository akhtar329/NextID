// app/robots.txt/route.ts

import { NextResponse } from "next/server";

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
  "Diffbot",
  "cohere-ai",
  "cohere-training-crawler",
  "Amazonbot",
  "FacebookBot",
  "FacebookExternalHit",
  "Applebot-Extended",
  "SemrushBot",
  "AhrefsBot",
  "MJ12bot",
  "Dotbot",
  "DataForSeoBot",
] as const;

const DISALLOW_PATHS = [
  "/admin/",
  "/login/",
  "/register/",
  "/forgot-password/",
  "/reset-password/",
  "/verify-email/",
  "/unauthorized/",
  "/api/",
];

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://www.nextid.pk")
  );
}

function generateRobots(baseUrl: string) {
  const lines: string[] = [];

  lines.push("# robots.txt");
  lines.push("# NextID.pk");
  lines.push("");

  // Block AI Crawlers
  AI_BOTS.forEach((bot) => {
    lines.push(`User-agent: ${bot}`);
    lines.push("Disallow: /");
    lines.push("");
  });

  // Default Rule
  lines.push("User-agent: *");

  DISALLOW_PATHS.forEach((path) => {
    lines.push(`Disallow: ${path}`);
  });

  lines.push("Allow: /");
  lines.push("");

  lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);

  return lines.join("\n");
}

export async function GET() {
  const robots = generateRobots(getBaseUrl());

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}