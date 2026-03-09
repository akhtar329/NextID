"use client";
import { useState, FormEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner"; // ← Sonner import

interface LoginFormData {
  email: string;
  password: string;
}

interface ApiResponse {
  error?: string;
  ok?: boolean;
  url?: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "admin@example.com",
    password: "admin123"
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const { data: session, status } = useSession();

  // Enhanced logging utility with types
  const logWithTime = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void => {
    const time = new Date().toLocaleTimeString('en-PK', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    
    const styles = {
      info: 'color: #3498db;',
      success: 'color: #2ecc71;',
      error: 'color: #e74c3c;',
      warning: 'color: #f39c12;'
    };
    
    console.log(`%c[${time}] ${icons[type]} ${message}`, styles[type]);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Email and password are required");
      toast.error("Please fill all fields");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      toast.error("Invalid email format");
      return false;
    }
    
    return true;
  };

  // Handle form submission with Sonner toast
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError("");
    setLoading(true);
    logWithTime("🚀 LOGIN PROCESS INITIATED", 'info');

    // Show loading toast
    const loadingToast = toast.loading("Authenticating...", {
      duration: Infinity,
    });

    try {
      logWithTime(`📧 Email: ${formData.email}`, 'info');
      logWithTime(`🔑 Password: ${formData.password ? '••••••••' : 'empty'}`, 'info');
      logWithTime(`🌐 Current URL: ${window.location.href}`, 'info');

      // Sign in with NextAuth
      logWithTime("🔐 Attempting authentication...", 'info');
      const result: ApiResponse = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      }) as ApiResponse;

      logWithTime(`📋 Authentication response received`, 'info');
      logWithTime(`✅ Success: ${!result?.error}`, result?.error ? 'error' : 'success');
      logWithTime(`❌ Error: ${result?.error || "None"}`, result?.error ? 'error' : 'success');

      if (result?.error) {
        logWithTime("❌ Authentication failed", 'error');
        setError("Invalid email or password");
        toast.error("Invalid credentials", {
          id: loadingToast,
        });
        return;
      }

      logWithTime("✅ Authentication successful!", 'success');
      
      // Verify session
      logWithTime("🔍 Verifying session...", 'info');
      const sessionResponse = await fetch('/api/auth/session');
      const sessionData = await sessionResponse.json();
      
      if (sessionData?.user) {
        logWithTime(`👤 User: ${sessionData.user.name}`, 'success');
        logWithTime(`🎯 Role: ${sessionData.user.role}`, 'success');
        toast.success(`Welcome back, ${sessionData.user.name}!`, {
          id: loadingToast,
        });
      } else {
        toast.success("Login successful!", {
          id: loadingToast,
        });
      }

      // Navigate to dashboard
      logWithTime("🔄 Redirecting to dashboard...", 'info');
      
      // Option 1: Using router with refresh
      router.push('/admin/dashboard');
      router.refresh();
      
      // Fallback: Using window.location after delay
      setTimeout(() => {
        if (window.location.pathname === '/login') {
          logWithTime("⏰ Fallback redirect activated", 'warning');
          window.location.href = '/admin/dashboard';
        }
      }, 1000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logWithTime(`💥 Unexpected error: ${errorMessage}`, 'error');
      console.error("Login error:", err);
      setError("An unexpected error occurred");
      toast.error("Login failed. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
      logWithTime("🏁 Login process completed", 'info');
    }
  };

  // Direct dashboard navigation with Sonner toast
  const navigateToDashboard = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    logWithTime("🔗 Manual dashboard navigation", 'info');
    
    const loadingToast = toast.loading("Checking access...");
    
    try {
      const response = await fetch('/admin');
      logWithTime(`📊 Admin endpoint status: ${response.status}`, 
        response.ok ? 'success' : 'error');
      
      if (response.ok) {
        toast.success("Access granted! Redirecting...", {
          id: loadingToast,
        });
        router.push('/admin/dashboard');
      } else {
        toast.error("Cannot access dashboard. Please login first.", {
          id: loadingToast,
        });
      }
    } catch (err) {
      logWithTime("❌ Dashboard access failed", 'error');
      toast.error("Unable to access dashboard", {
        id: loadingToast,
      });
    }
  };

  // Test routes functionality with Sonner toast
  const testAdminRoutes = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    logWithTime("🧪 Testing admin routes...", 'info');
    
    const loadingToast = toast.loading("Testing routes...");
    
    const routes = ['/admin', '/admin/dashboard', '/api/auth/session'];
    let successCount = 0;
    let totalRoutes = routes.length;
    
    for (const route of routes) {
      try {
        const startTime = Date.now();
        const response = await fetch(route);
        const endTime = Date.now();
        
        logWithTime(
          `🔍 ${route}: ${response.status} (${endTime - startTime}ms)`,
          response.ok ? 'success' : 'error'
        );
        
        if (response.ok) successCount++;
        
      } catch (err) {
        logWithTime(`❌ ${route}: Failed to fetch`, 'error');
      }
    }
    
    if (successCount === totalRoutes) {
      toast.success(`All ${totalRoutes} routes accessible!`, {
        id: loadingToast,
      });
    } else {
      toast.warning(`${successCount}/${totalRoutes} routes accessible`, {
        id: loadingToast,
      });
    }
  };

  // Alternative: Promise-based approach with Sonner (Fixed Version)
  const handleSubmitWithPromise = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      // Create the toast promise
      const loginPromise = signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      }).then(async (result) => {
        if (result?.error) {
          throw new Error("Invalid credentials");
        }
        
        // Verify session
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (sessionData?.user) {
          router.push('/admin/dashboard');
          return `Welcome ${sessionData.user.name}!`;
        } else {
          router.push('/admin/dashboard');
          return "Login successful!";
        }
      });
      
      // Use toast.promise properly
      await toast.promise(loginPromise, {
        loading: 'Authenticating...',
        success: (message: string) => message,
        error: (err: Error) => err.message || 'Login failed',
      });
      
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-gray-500 mt-2">Sign in to access the dashboard</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">Please check your credentials and try again</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="admin@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Debug Panel */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Debug Tools</h3>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              Development
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={navigateToDashboard}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              Dashboard
            </button>
            
            <button
              type="button"
              onClick={testAdminRoutes}
              disabled={loading}
              className="flex items-center justify-center px-4 py-2.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 border border-violet-200 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Test Routes
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-medium mb-1">Debug Instructions:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open Browser Console (F12)</li>
              <li>Click "Sign In" button</li>
              <li>Monitor real-time logs</li>
              <li>Check Network tab for API calls</li>
              <li>Watch for Sonner toast notifications</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Admin Portal. For authorized personnel only.</p>
          <p className="mt-1">Secure authentication powered by NextAuth.js</p>
        </div>
      </div>
    </div>
  );
}