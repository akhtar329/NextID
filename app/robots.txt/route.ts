
import { NextResponse } from "next/server";

const SITE_URL = "https://www.nextid.pk";



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

function generateRobots() {
  const lines: string[] = [];

  lines.push("# robots.txt");
  lines.push("# NextID.pk");
  lines.push("");

  lines.push("User-agent: *");

  DISALLOW_PATHS.forEach((path) => {
    lines.push(`Disallow: ${path}`);
  });

  lines.push("Allow: /");
  lines.push("");

  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`);

  return lines.join("\n");
}

export async function GET() {
  const robots = generateRobots();

  return new NextResponse(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
