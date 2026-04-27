// app/maintenance/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/maintenance/toggle');
        const data = await res.json();
        
        // Agar maintenance mode OFF hai to root par redirect
        if (data.success && !data.isEnabled) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Failed to check maintenance status');
      } finally {
        setMounted(true);
      }
    };
    
    checkStatus();
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4">🔧</div>
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          🔧 Site Under Maintenance
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          We are currently performing scheduled maintenance. Please check back soon.
        </p>

        <div className="max-w-md mx-auto mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-600 rounded-full"
              style={{ width: '66%' }}
            ></div>
          </div>
        </div>

        <p className="text-gray-500 text-sm">
          We&apos;re working hard to improve your experience. Please check back soon!
        </p>
      </div>
    </div>
  );
}