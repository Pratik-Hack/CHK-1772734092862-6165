"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { vitalsService } from "@/services/vitals.service";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/utils";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => { vitalsService.getPatientAlerts(user?.id || "").then(res => setAlerts(Array.isArray(res) ? res : [])).catch(() => {}).finally(() => setLoading(false)); }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Vital Alerts</h1>
        {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : alerts.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">✅</span><p>No alerts - you&apos;re healthy!</p></div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div key={alert._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`glass rounded-xl p-4 border-l-4 ${alert.severity === "critical" || alert.severity === "high" ? "border-red-500" : alert.severity === "warning" || alert.severity === "medium" ? "border-yellow-500" : "border-blue-500"}`}>
                <div className="flex items-start justify-between">
                  <div><p className="font-medium">{alert.message || "Abnormal vital detected"}</p><p className="text-sm text-gray-500 mt-1">{alert.vitalType || alert.vital || alert.type} · {formatDateTime(alert.createdAt || alert.timestamp)}</p></div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === "critical" || alert.severity === "high" ? "bg-red-100 text-red-600" : alert.severity === "warning" || alert.severity === "medium" ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>{alert.severity}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
