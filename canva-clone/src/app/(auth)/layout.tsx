"use client";

import { useState } from "react";

const LANGS = [
  { code: "vn", label: "VN" },
  { code: "jp", label: "JP" },
  { code: "en", label: "EN" },
];

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [lang, setLang] = useState("en");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* Language switcher */}
      <div className="fixed top-4 right-4 flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-sm border border-gray-200">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
              lang === l.code
                ? "bg-indigo-600 text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
