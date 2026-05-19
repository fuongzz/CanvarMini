"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";

export const SignInCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const params = useSearchParams();
  const error = params.get("error");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    signIn("credentials", { email, password, callbackUrl: "/" });
  };

  const onGoogle = () => {
    setLoadingGoogle(true);
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
      {/* Logo */}
      <div className="mb-6">
        <span className="text-2xl font-extrabold text-white bg-indigo-600 px-3 py-1 rounded-lg tracking-tight">
          Canvar
        </span>
      </div>

      {!!error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-sm text-red-600 mb-5">
          <TriangleAlert className="size-4 shrink-0" />
          <p>Invalid email or password</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            required
            disabled={loading}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition disabled:opacity-60"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline font-medium">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
          />
          <span className="text-sm text-gray-600">Keep me logged in</span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign In Now
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <button
        onClick={onGoogle}
        disabled={loadingGoogle || loading}
        className="w-full border border-gray-200 hover:bg-gray-50 rounded-xl py-3 text-sm font-medium text-gray-700 flex items-center justify-center gap-2 transition disabled:opacity-60"
      >
        {loadingGoogle
          ? <Loader2 className="size-4 animate-spin" />
          : <FcGoogle className="size-5" />
        }
        Continue with Google
      </button>

      {/* Sign up link */}
      <p className="text-sm text-center text-gray-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-indigo-600 font-semibold hover:underline">
          Join for free
        </Link>
      </p>
    </div>
  );
};
