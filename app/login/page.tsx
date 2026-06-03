// app/login/page.tsx
"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

// ✅ Client component for dynamic year
function Copyright() {
  const [year] = useState(new Date().getFullYear());
  return <span>© {year} NextID.pk</span>;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Welcome back 👋");
        router.push("/admin");
        router.refresh();
      } else {
        toast.error(data.error || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl rounded-3xl p-8">

          {/* Logo + Header */}
          <div className="text-center mb-6">
            {/* ✅ Fixed: Using Next.js Image component */}
            <div className="relative w-12 h-12 mx-auto mb-3">
              <Image
                src="/images/logo.png"
                alt="NextID Logo"
                fill
                className="object-contain"
                onError={(e) => {
                  // Hide parent div if image fails to load
                  const parent = e.currentTarget.parentElement;
                  if (parent) parent.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Login to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full mt-1 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-xl outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-xl pr-12 outline-none transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Button */}
            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

          </form>
        </div>

        {/* Footer - ✅ Fixed: Suspense boundary */}
        <p className="text-center text-xs text-gray-400 mt-6">
          <Suspense fallback={<span>© NextID.pk</span>}>
            <Copyright />
          </Suspense>
        </p>
      </div>
    </div>
  );
}