"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { motion } from "framer-motion";

const tiles = [
  { label: "My Patients", href: "/doctor/patients", icon: "👥", color: "from-blue-500 to-blue-600" },
  { label: "Diagnostics", href: "/doctor/diagnostics", icon: "🔬", color: "from-green-500 to-green-600" },
  { label: "Reports", href: "/doctor/reports", icon: "📊", color: "from-purple-500 to-purple-600" },
  { label: "Notifications", href: "/doctor/notifications", icon: "🔔", color: "from-[#FF6B35] to-[#FF8C61]" },
];

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Welcome, Dr. {user?.name || "Doctor"} 👋</h1>
          <p className="text-gray-500 mt-1">Your doctor dashboard</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          {tiles.map((tile, i) => (
            <motion.div key={tile.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={tile.href} className="block"><div className={`bg-gradient-to-br ${tile.color} rounded-2xl p-6 text-white hover:shadow-lg transition-shadow`}><span className="text-3xl block mb-3">{tile.icon}</span><span className="font-semibold">{tile.label}</span></div></Link>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
