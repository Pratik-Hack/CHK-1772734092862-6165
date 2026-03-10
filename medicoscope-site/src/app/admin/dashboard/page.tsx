"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminService } from "@/services/admin.service";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const tiles = [
  { label: "Patients", href: "/admin/patients", icon: "👥", color: "from-blue-500 to-blue-600" },
  { label: "Doctors", href: "/admin/doctors", icon: "⚕️", color: "from-green-500 to-green-600" },
  { label: "Nearby Doctors", href: "/admin/nearby-doctors", icon: "📍", color: "from-purple-500 to-purple-600" },
];

interface Stats {
  totalPatients?: number;
  totalDoctors?: number;
  totalNearbyDoctors?: number;
  [key: string]: unknown;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getStats()
      .then((res) => setStats(res))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Welcome, {user?.name || "Admin"} 👋</h1>
          <p className="text-gray-500 mt-1">Admin Dashboard</p>
        </motion.div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading stats...</div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Patients", value: stats.totalPatients ?? "—", icon: "👥" },
              { label: "Doctors", value: stats.totalDoctors ?? "—", icon: "⚕️" },
              { label: "Nearby Doctors", value: stats.totalNearbyDoctors ?? "—", icon: "📍" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center"
              >
                <span className="text-3xl block mb-2">{stat.icon}</span>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((tile, i) => (
            <motion.div key={tile.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.3 }}>
              <Link href={tile.href} className="block">
                <div className={`bg-gradient-to-br ${tile.color} rounded-2xl p-6 text-white hover:shadow-lg transition-shadow`}>
                  <span className="text-3xl block mb-3">{tile.icon}</span>
                  <span className="font-semibold">{tile.label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
