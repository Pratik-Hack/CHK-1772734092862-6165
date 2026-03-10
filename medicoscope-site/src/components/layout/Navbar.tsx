"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useCoinsStore } from "@/stores/coinsStore";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalCoins } = useCoinsStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#1a1a1a]/80 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] bg-clip-text text-transparent">
              MedicoScope
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hello, <span className="font-semibold text-foreground">{user.name}</span>
                </span>
                {user.role === "patient" && (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    <span className="text-sm">⭐</span>
                    <span className="text-sm font-semibold">{totalCoins}</span>
                  </div>
                )}
                <ThemeToggle />
                <Link href={`/${user.role}/dashboard`} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#FF6B35] transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#FF6B35] transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] px-4 py-3 space-y-2">
          {isAuthenticated && user ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 py-2">Hello, <span className="font-semibold">{user.name}</span></p>
              <Link href={`/${user.role}/dashboard`} className="block py-2 text-sm font-medium hover:text-[#FF6B35]" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="block py-2 text-sm font-medium text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2 text-sm font-medium hover:text-[#FF6B35]" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link href="/register" className="block py-2 text-sm font-medium text-[#FF6B35]" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </motion.div>
      )}
    </nav>
  );
}
