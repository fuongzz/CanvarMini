"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Eye, EyeOff, Loader2, TriangleAlert, CheckCircle2 } from "lucide-react";

type Step = "email" | "otp" | "done";

export const ForgotPasswordCard = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: gửi OTP ──────────────────────────────────────────────────────────
  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStep("otp");
    } catch {
      setError("Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ───────────────────────────────────────────────────────
  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[i] = value.slice(-1);
    setOtp(next);
    if (value && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  // ── Step 2: reset password ───────────────────────────────────────────────────
  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(""), newPassword }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid OTP");
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
      {/* Logo */}
      <div className="mb-6">
        <span className="text-2xl font-extrabold text-white bg-indigo-600 px-3 py-1 rounded-lg tracking-tight">
          Canvar
        </span>
      </div>

      {step === "done" ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <CheckCircle2 className="size-14 text-green-500" />
          <p className="text-lg font-semibold text-gray-800">Password updated!</p>
          <p className="text-sm text-gray-500 text-center">You can now sign in with your new password.</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-3 text-sm transition"
          >
            Go to Sign In
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-bold text-gray-800 mb-1">Forget Password</h2>
          <p className="text-xs text-gray-400 mb-6">
            {step === "email"
              ? "Enter your email to receive a 6-digit code."
              : `Code sent to ${email}. Enter below and set new password.`}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-sm text-red-600 mb-5">
              <TriangleAlert className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={step === "email" ? sendCode : resetPassword} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || step === "otp"}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition disabled:opacity-60 disabled:bg-gray-50"
              />
            </div>

            {step === "email" && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Send Code
              </button>
            )}

            {step === "otp" && (
              <>
                {/* OTP */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                    OTP Code
                  </label>
                  <div className="flex gap-2 justify-between">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        disabled={loading}
                        className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 transition disabled:opacity-60"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Check your terminal for the OTP code (dev mode).
                  </p>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={3}
                      disabled={loading}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition disabled:opacity-60"
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition disabled:opacity-60"
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || otp.some((d) => !d)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/sign-in")}
                    disabled={loading}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl py-3 text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        </>
      )}
    </div>
  );
};
