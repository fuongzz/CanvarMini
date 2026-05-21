"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, TriangleAlert, User } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useLanguage } from "@/contexts/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";

const DEMO_ACCOUNTS = [
  { label: "Demo Account A", email: "demo.a@canvar.com", password: "demo123" },
  { label: "Demo Account B", email: "demo.b@canvar.com", password: "demo123" },
];

export const SignInCard = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const params = useSearchParams();
  const error = params.get("error");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    signIn("credentials", { email, password, callbackUrl: "/" });
  };

  const onDemoLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(account.label);
    signIn("credentials", { email: account.email, password: account.password, callbackUrl: "/" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
      {/* Header: Logo + Language Switcher */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-2xl font-extrabold text-white bg-indigo-600 px-3 py-1 rounded-lg tracking-tight">
          {t.appName}
        </span>
        <LanguageSwitcher />
      </div>

      {/* Demo accounts */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
          {t.quickDemoAccess}
        </p>
        <div className="flex gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.label}
              onClick={() => onDemoLogin(account)}
              disabled={!!demoLoading || loading}
              className="flex-1 border border-indigo-200 bg-white hover:bg-indigo-50 rounded-lg py-2 text-xs font-medium text-indigo-700 flex items-center justify-center gap-1.5 transition disabled:opacity-60"
            >
              {demoLoading === account.label
                ? <Loader2 className="size-3 animate-spin" />
                : <User className="size-3" />
              }
              {account.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-indigo-400 mt-2">
          {t.password}: <span className="font-mono font-semibold">demo123</span>
        </p>
      </div>

      {!!error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-sm text-red-600 mb-5">
          <TriangleAlert className="size-4 shrink-0" />
          <p>{t.invalidCredentials}</p>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{t.orSignInManually}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
            {t.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            required
            disabled={loading || !!demoLoading}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition disabled:opacity-60"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t.password}
            </label>
            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline font-medium">
              {t.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.emailPlaceholder.replace("email", "••••••••").replace("ten@", "").replace("name@", "")}
              required
              disabled={loading || !!demoLoading}
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

        <button
          type="submit"
          disabled={loading || !!demoLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {t.signInNow}
        </button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-6">
        {t.noAccount}{" "}
        <Link href="/sign-up" className="text-indigo-600 font-semibold hover:underline">
          {t.joinFree}
        </Link>
      </p>
    </div>
  );
};
