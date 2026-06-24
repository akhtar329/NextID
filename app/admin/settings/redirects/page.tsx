import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

interface SaveRedirectsBody {
  redirects: RedirectRule[];
}

const CONFIG_PATH = path.join(
  process.cwd(),
  "services",
  "redirects",
  "redirects-config.ts"
);

function loadRedirects(): RedirectRule[] {
  try {
    const content = fs.readFileSync(CONFIG_PATH, "utf8");

    const matches = [
      ...content.matchAll(
        /from:\s*(\/\^[^,]+\/|["'`][^"'`]+["'`])[\s\S]*?to:\s*['"`]([^'"`]+)['"`][\s\S]*?status:\s*(301|302)/g
      ),
    ];

    return matches.map((match) => ({
      from: match[1].replace(/^['"`]|['"`]$/g, ""),
      to: match[2],
      status: Number(match[3]) as 301 | 302,
    }));
  } catch (error) {
    console.error("Failed to load redirects:", error);
    return [];
  }
}

function generateConfigContent(redirects: RedirectRule[]) {
  const rules = redirects
    .map((rule) => {
      const from = rule.from.startsWith("/")
        ? rule.from
        : `'${rule.from}'`;

      return `  {
    from: ${from},
    to: '${rule.to}',
    status: ${rule.status},
  },`;
    })
    .join("\n");

  return `interface RedirectRule {
  from: string | RegExp;
  to: string;
  status: 301 | 302;
}

const redirectRules: RedirectRule[] = [
${rules}
];

function removeTrailingSlash(pathname: string): string {
  if (pathname === "/") return pathname;

  if (pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function matchRule(pathname: string, rule: RedirectRule): boolean {
  if (rule.from instanceof RegExp) {
    return rule.from.test(pathname);
  }

  return pathname === rule.from;
}

export function getRedirect(
  pathname: string
): { to: string; status: 301 | 302 } | null {
  const cleanPath = removeTrailingSlash(pathname);

  for (const rule of redirectRules) {
    if (matchRule(cleanPath, rule)) {
      return {
        to: rule.to,
        status: rule.status,
      };
    }
  }

  return null;
}

export function getAllRedirectRules(): RedirectRule[] {
  return redirectRules;
}
`;
}

let currentRedirects: RedirectRule[] = loadRedirects();

export async function GET() {
  try {
    currentRedirects = loadRedirects();

    return NextResponse.json({
      success: true,
      data: currentRedirects,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load redirects",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveRedirectsBody;

    if (!Array.isArray(body.redirects)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid redirects data",
        },
        { status: 400 }
      );
    }

    const redirects = body.redirects;

    for (const rule of redirects) {
      if (!rule.from?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: '"from" is required',
          },
          { status: 400 }
        );
      }

      if (!rule.to?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: '"to" is required',
          },
          { status: 400 }
        );
      }

      if (rule.status !== 301 && rule.status !== 302) {
        return NextResponse.json(
          {
            success: false,
            error: "Status must be 301 or 302",
          },
          { status: 400 }
        );
      }
    }

    const unique = new Set(redirects.map((r) => r.from));

    if (unique.size !== redirects.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate redirect paths found",
        },
        { status: 400 }
      );
    }

    const content = generateConfigContent(redirects);

    fs.writeFileSync(CONFIG_PATH, content, "utf8");

    currentRedirects = redirects;

    return NextResponse.json({
      success: true,
      message: `${redirects.length} redirects saved successfully`,
      count: redirects.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save redirects",
      },
      { status: 500 }
    );
  }
}