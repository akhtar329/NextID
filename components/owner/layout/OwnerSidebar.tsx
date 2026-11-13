
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  FileCheck,
  Package,
  CreditCard,
  Receipt,
  UserRound,
  Settings,
  ShieldCheck,
  Headset,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface OwnerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  onLogout?: () => void;
}

const menuGroups = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/users/owner/institute/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "INSTITUTE MANAGEMENT",
    items: [
      {
        label: "My Institutes",
        href: "/users/owner/institute",
        icon: Building2,
      },
      {
        label: "Register Institute",
        href: "/users/owner/institute/register",
        icon: PlusCircle,
      },
      {
        label: "Institute Registrations",
        href: "/users/owner/institute/registrations",
        icon: FileCheck,
      },
    ],
  },
  {
    title: "FINANCIAL MANAGEMENT",
    items: [
      {
        label: "Subscription Plans",
        href: "/users/owner/institute/subscription",
        icon: Package,
      },
      {
        label: "Payments",
        href: "/users/owner/institute/payments",
        icon: CreditCard,
      },
      {
        label: "Invoices",
        href: "/users/owner/institute/invoices",
        icon: Receipt,
      },
    ],
  },
  {
    title: "ACCOUNT & SUPPORT",
    items: [
      {
        label: "My Profile",
        href: "/users/owner/institute/profile",
        icon: UserRound,
      },
      {
        label: "Account Settings",
        href: "/users/owner/institute/settings",
        icon: Settings,
      },
      {
        label: "Security",
        href: "/users/owner/institute/security",
        icon: ShieldCheck,
      },
      {
        label: "Support & Complaints",
        href: "/users/owner/institute/support",
        icon: Headset,
      },
    ],
  },
];

export default function OwnerSidebar({
  collapsed,
  onToggle,
  onNavigate,
  onLogout,
}: OwnerSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/owner") {
      return pathname === "/owner";
    }

    // Keep institute registration separate from My Institutes.
    if (href === "/owner/institutes") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={`
        relative flex h-full shrink-0 flex-col
        border-r border-slate-200 bg-white
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[76px]" : "w-[260px]"}
      `}
    >
      {/* Brand */}
      <div
        className={`
          flex h-[76px] shrink-0 items-center
          border-b border-slate-100
          ${collapsed ? "justify-center px-2" : "gap-3 px-5"}
        `}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
          <Building2 size={22} strokeWidth={2.2} />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-[19px] font-extrabold tracking-tight text-slate-900">
              NextID
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-slate-400">
              OWNER PORTAL
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              {!collapsed ? (
                <p className="mb-2.5 px-3 text-[10px] font-bold tracking-[0.13em] text-slate-400">
                  {group.title}
                </p>
              ) : (
                <div className="mx-auto mb-3 h-px w-8 bg-slate-200" />
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`
                        group relative flex h-11 items-center gap-3
                        rounded-lg px-3 text-[13px] font-medium
                        transition-colors duration-200
                        ${
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                        ${collapsed ? "justify-center px-0" : ""}
                      `}
                    >
                      {active && (
                        <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-blue-600" />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={`
                          shrink-0 transition-colors
                          ${
                            active
                              ? "text-blue-600"
                              : "text-slate-400 group-hover:text-slate-600"
                          }
                        `}
                      />

                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Area */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <div
          className={`
            mb-3 flex items-center rounded-xl
            bg-slate-50 p-2.5
            ${collapsed ? "justify-center" : "gap-3"}
          `}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <UserRound size={18} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                Institute Owner
              </p>
              <p className="text-[10px] text-slate-500">
                Owner Account
              </p>
            </div>
          )}
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={`
              mb-2 flex h-10 w-full items-center gap-3
              rounded-lg px-3 text-[13px] font-medium
              text-red-600 transition-colors
              hover:bg-red-50
              ${collapsed ? "justify-center px-0" : ""}
            `}
          >
            <LogOut size={18} />
            {!collapsed && "Logout"}
          </button>
        )}

        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span className="text-xs font-medium">
                Collapse Sidebar
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
