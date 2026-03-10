"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCoinsStore } from "@/stores/coinsStore";
import { rewardsService } from "@/services/rewards.service";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { motion } from "framer-motion";

const quickActions = [
  { label: "AI Scan", href: "/patient/scan", icon: "🔬", color: "from-blue-500 to-blue-600" },
  { label: "Heart Monitor", href: "/patient/heart", icon: "❤️", color: "from-red-500 to-red-600" },
  { label: "Vitals", href: "/patient/vitals", icon: "📊", color: "from-green-500 to-green-600" },
  { label: "MindSpace", href: "/patient/mindspace", icon: "🧠", color: "from-purple-500 to-purple-600" },
  { label: "AI Chat", href: "/patient/chat", icon: "💬", color: "from-[#FF6B35] to-[#FF8C61]" },
  { label: "Rewards", href: "/patient/rewards", icon: "⭐", color: "from-amber-500 to-amber-600" },
];

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { totalCoins, streak, setSyncData } = useCoinsStore();

  useEffect(() => {
    rewardsService.getBalance().then((r: any) => {
      if (r) setSyncData({ totalCoins: r.totalCoins, streak: r.currentStreak, sessions: r.totalSessions });
    }).catch(() => {});
  }, [setSyncData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Welcome, {user?.name || "Patient"} 👋</h1>
          <p className="text-gray-500 mt-1">Your health dashboard</p>
          <div className="flex gap-4 mt-4">
            <div className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              <span className="text-sm">⭐ {totalCoins} coins</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <span className="text-sm">🔥 {streak} day streak</span>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <motion.div key={action.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={action.href} className="block">
                <div className={`bg-gradient-to-br ${action.color} rounded-2xl p-6 text-white hover:shadow-lg transition-shadow`}>
                  <span className="text-3xl block mb-3">{action.icon}</span>
                  <span className="font-semibold">{action.label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "My Profile", href: "/patient/profile", icon: "👤" },
              { label: "My QR Code", href: "/patient/my-code", icon: "📱" },
              { label: "Link Doctor", href: "/patient/link-doctor", icon: "🔗" },
              { label: "Vital Alerts", href: "/patient/alerts", icon: "🔔" },
              { label: "Nearby Doctors", href: "/patient/nearby-doctors", icon: "📍" },
              { label: "Chat History", href: "/patient/chat/history", icon: "💬" },
            ].map(link => (
              <Link key={link.href} href={link.href} className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span>{link.icon}</span>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
