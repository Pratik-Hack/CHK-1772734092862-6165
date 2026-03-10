"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/authStore";
import { vitalsService } from "@/services/vitals.service";
import { doctorService } from "@/services/doctor.service";
import { usePolling } from "@/hooks/usePolling";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const uid = user?.id || "";

  const { data: alerts } = usePolling(
    () => uid ? vitalsService.getDoctorAlerts(uid).then(r => Array.isArray(r) ? r : []).catch(() => []) : Promise.resolve([]),
    10000,
    [uid]
  );
  const { data: patients } = usePolling(
    () => doctorService.getPatients().then(r => Array.isArray(r) ? r : []).catch(() => []),
    30000,
    []
  );

  const alertCount = (alerts ?? []).length;
  const patientCount = (patients ?? []).length;

  const tiles = [
    { label: "My Patients", href: "/doctor/patients", icon: "👥", color: "from-blue-500 to-blue-600", count: patientCount },
    { label: "Diagnostics", href: "/doctor/diagnostics", icon: "🔬", color: "from-green-500 to-green-600" },
    { label: "Reports", href: "/doctor/reports", icon: "📊", color: "from-purple-500 to-purple-600" },
    { label: "Notifications", href: "/doctor/notifications", icon: "🔔", color: "from-[#FF6B35] to-[#FF8C61]", count: alertCount },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome, Dr. {user?.name || "Doctor"} 👋</h1>
              <p className="text-gray-500 mt-1">Your doctor dashboard</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</span>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          {tiles.map((tile, i) => (
            <motion.div key={tile.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link href={tile.href} className="block">
                <div className={`bg-gradient-to-br ${tile.color} rounded-2xl p-6 text-white hover:shadow-lg transition-shadow relative`}>
                  <span className="text-3xl block mb-3">{tile.icon}</span>
                  <span className="font-semibold">{tile.label}</span>
                  {tile.count !== undefined && tile.count > 0 && (
                    <span className="absolute top-3 right-3 bg-white text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">{tile.count}</span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
