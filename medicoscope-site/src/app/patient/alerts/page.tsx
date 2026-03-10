"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { vitalsService } from "@/services/vitals.service";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { formatDateTime } from "@/lib/utils";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => { if (!user?.id) return; vitalsService.getPatientAlerts(user.id).then(res => setAlerts(Array.isArray(res) ? res : [])).catch(() => toast.error("Failed to load alerts")).finally(() => setLoading(false)); }, [user]);

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Vital Alerts</h1>
        {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : alerts.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">✅</span><p>No alerts - you&apos;re healthy!</p></div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const aid = alert._id || String(i);
              const isOpen = expandedId === aid;
              const sevColor = alert.severity === "critical" || alert.severity === "high" ? "border-red-500" : alert.severity === "warning" || alert.severity === "medium" ? "border-yellow-500" : "border-blue-500";
              return (
                <motion.div key={aid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass rounded-xl border-l-4 ${sevColor} cursor-pointer hover:ring-1 hover:ring-gray-400/30 transition-all`}
                  onClick={() => toggle(aid)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.message || "Abnormal vital detected"}</p>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{alert.vitalType || alert.vital || alert.type} · {formatDateTime(alert.createdAt || alert.timestamp)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === "critical" || alert.severity === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : alert.severity === "warning" || alert.severity === "medium" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}>{alert.severity}</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                          <div className="pt-3 space-y-2 text-sm">
                            {alert.severity && <div className="flex gap-2"><span className="text-gray-500 w-24">Severity:</span><span className="font-medium">{alert.severity}</span></div>}
                            {(alert.vitalType || alert.vital || alert.type) && <div className="flex gap-2"><span className="text-gray-500 w-24">Vital Type:</span><span>{alert.vitalType || alert.vital || alert.type}</span></div>}
                            {alert.value != null && <div className="flex gap-2"><span className="text-gray-500 w-24">Value:</span><span className="font-medium">{alert.value} {alert.unit || ""}</span></div>}
                            {alert.threshold != null && <div className="flex gap-2"><span className="text-gray-500 w-24">Threshold:</span><span>{alert.threshold} {alert.unit || ""}</span></div>}
                            {alert.message && <div className="flex gap-2"><span className="text-gray-500 w-24">Message:</span><span>{alert.message}</span></div>}
                            <div className="flex gap-2"><span className="text-gray-500 w-24">Recorded:</span><span>{formatDateTime(alert.createdAt || alert.timestamp)}</span></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
