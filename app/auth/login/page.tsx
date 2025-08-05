"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials or server error.");
      }

      // ✅ Extract correct userId
      const userId = data.userId || data._id;
      if (!userId) throw new Error("Login failed: No user ID received.");

      // ✅ Save clean session
      localStorage.clear();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("role", data.role);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: userId,
          name: data.name,
          email: data.email,
          role: data.role,
        })
      );

      console.log("✅ userId saved to localStorage:", userId);

      // ✅ Redirect
      if (["admin", "company", "distributor", "shopkeeper"].includes(data.role)) {
        router.push(`/${data.role}/`);
      } else {
        throw new Error("Invalid user role received.");
      }

    } catch (err: any) {
      setError(err.message);
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src="/logo.png" className="mx-auto w-16 h-16 mb-4" alt="Pharma CRM" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in to your account</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Not a member?{" "}
          <Link href="/auth/signup" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Register now
          </Link>
        </p>
      </div>
    </main>
  );
}
