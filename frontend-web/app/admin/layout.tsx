// app/admin/layout.tsx
"use client";
import { ReactNode } from "react";
import Sidebar from "@/app/component/layout/Sidebar";
import Topbar from "@/app/component/layout/Topbar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Temporary: Remove session check
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}