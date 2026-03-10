"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { vitalsService } from "@/services/vitals.service";
import { mentalHealthService } from "@/services/mental-health.service";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [tab, setTab] = useState<"vitals" | "mindspace">("vitals");
  const [vitalAlerts, setVitalAlerts] = useState<any[]>([]);
  const [mindspaceAlerts, setMindspaceAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      vitalsService.getDoctorAlerts(user?.id || "").catch(() => ({ data: [] })),
      mentalHealthService.getDoctorNotifications(user?.id || "").catch(() => ({ data: [] })),
    ]).then(([vitals, mindspace]) => {
      setVitalAlerts(Array.isArray(vitals) ? vitals : vitals.data || []);
      setMindspaceAlerts(Array.isArray(mindspace) ? mindspace : mindspace.data || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleDeleteAlert = async (id: string) => {
    try { await vitalsService.deleteAlert(id); setVitalAlerts(prev => prev.filter(a => a._id !== id)); toast.success("Alert dismissed"); } catch { toast.error("Failed"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          {(["vitals", "mindspace"] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? "gradient-primary text-white" : "bg-gray-100 dark:bg-gray-800"}`}>{t === "vitals" ? "🔔 Vital Alerts" : "🧠 MindSpace"}</button>))}
        </div>
        {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : (
          <div className="space-y-3">
            {tab === "vitals" ? (
              vitalAlerts.length === 0 ? <div className="text-center py-20 text-gray-400">No vital alerts</div> :
              vitalAlerts.map((alert, i) => (
                <motion.div key={alert._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border-l-4 border-red-500">
                  <div className="flex items-start justify-between">
                    <div><p className="font-medium">{alert.message}</p><p className="text-sm text-gray-500">Patient: {alert.patientName || alert.patientId} · {formatDateTime(alert.createdAt || alert.timestamp)}</p></div>
                    <button onClick={() => handleDeleteAlert(alert._id)} className="text-sm text-gray-400 hover:text-red-500">Dismiss</button>
                  </div>
                </motion.div>
              ))
            ) : (
              mindspaceAlerts.length === 0 ? <div className="text-center py-20 text-gray-400">No MindSpace notifications</div> :
              mindspaceAlerts.map((notif, i) => (
                <motion.div key={notif._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 border-l-4 border-purple-500">
                  <div><p className="font-medium">{notif.mood || notif.emotion || notif.urgency || "Mental health report"}</p><p className="text-sm text-gray-500">Patient: {notif.patientName || notif.patientId} · {formatDateTime(notif.createdAt || notif.timestamp)}</p></div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
