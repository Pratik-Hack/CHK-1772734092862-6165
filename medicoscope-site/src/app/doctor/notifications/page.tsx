"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { vitalsService } from "@/services/vitals.service";
import { mentalHealthService } from "@/services/mental-health.service";
import { useAuthStore } from "@/stores/authStore";
import { usePolling } from "@/hooks/usePolling";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const [tab, setTab] = useState<"vitals" | "mindspace">("vitals");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const uid = user?.id || "";

  const { data: vitalAlerts, loading: loadingV, refresh: refreshV } = usePolling(
    () => uid ? vitalsService.getDoctorAlerts(uid).then(r => Array.isArray(r) ? r : []).catch(() => []) : Promise.resolve([]),
    10000,
    [uid]
  );

  const { data: mindspaceAlerts, loading: loadingM } = usePolling(
    () => uid ? mentalHealthService.getDoctorNotifications(uid).then(r => Array.isArray(r) ? r : []).catch(() => []) : Promise.resolve([]),
    15000,
    [uid]
  );

  const loading = loadingV || loadingM;

  const handleDeleteAlert = async (id: string) => {
    try { await vitalsService.deleteAlert(id); refreshV(); toast.success("Alert dismissed"); } catch { toast.error("Failed"); }
  };

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <span className="flex items-center gap-1.5 text-xs text-green-500"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live</span>
        </div>
        <div className="flex gap-2">
          {(["vitals", "mindspace"] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? "gradient-primary text-white" : "bg-gray-100 dark:bg-gray-800"}`}>{t === "vitals" ? `🔔 Vital Alerts (${(vitalAlerts ?? []).length})` : `🧠 MindSpace (${(mindspaceAlerts ?? []).length})`}</button>))}
        </div>
        {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : (
          <div className="space-y-3">
            {tab === "vitals" ? (
              (vitalAlerts ?? []).length === 0 ? <div className="text-center py-20 text-gray-400">No vital alerts</div> :
              (vitalAlerts ?? []).map((alert, i) => {
                const aid = alert._id || String(i);
                const isOpen = expandedId === `v-${aid}`;
                return (
                  <motion.div key={aid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl border-l-4 border-red-500 cursor-pointer hover:ring-1 hover:ring-red-400/50 transition-all"
                    onClick={() => toggle(`v-${aid}`)}>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{alert.message}</p>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                          <p className="text-sm text-gray-500">Patient: {alert.patientName || alert.patientId} · {formatDateTime(alert.createdAt || alert.timestamp || new Date().toISOString())}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteAlert(alert._id ?? ""); }} className="text-sm text-gray-400 hover:text-red-500 ml-2">Dismiss</button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                            <div className="pt-3 space-y-2">
                              {alert.severity && <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Severity:</span><span className={`text-sm font-medium ${alert.severity === "critical" || alert.severity === "high" ? "text-red-500" : alert.severity === "warning" || alert.severity === "medium" ? "text-yellow-500" : "text-blue-500"}`}>{alert.severity}</span></div>}
                              {(alert.vitalType || alert.vital || alert.type) && <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Vital Type:</span><span className="text-sm">{alert.vitalType || alert.vital || alert.type}</span></div>}
                              {alert.value != null && <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Value:</span><span className="text-sm font-medium">{alert.value} {alert.unit || ""}</span></div>}
                              {alert.threshold != null && <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Threshold:</span><span className="text-sm">{alert.threshold} {alert.unit || ""}</span></div>}
                              <div className="flex gap-2"><span className="text-sm text-gray-500 w-24">Time:</span><span className="text-sm">{formatDateTime(alert.createdAt || alert.timestamp || new Date().toISOString())}</span></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              (mindspaceAlerts ?? []).length === 0 ? <div className="text-center py-20 text-gray-400">No MindSpace notifications</div> :
              (mindspaceAlerts ?? []).map((notif, i) => {
                const nid = notif.id || notif._id || String(i);
                const isOpen = expandedId === `m-${nid}`;
                const report = notif.doctorReport || notif.report || "";
                return (
                  <motion.div key={nid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl border-l-4 border-purple-500 cursor-pointer hover:ring-1 hover:ring-purple-400/50 transition-all"
                    onClick={() => toggle(`m-${nid}`)}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notif.urgency || "Mental health report"}</p>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                      <p className="text-sm text-gray-500">Patient: {notif.patientName || notif.patient_name || notif.patientId || notif.patient_id} · {formatDateTime(notif.timestamp || notif.createdAt || new Date().toISOString())}</p>
                      {!isOpen && report && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{report.substring(0, 200)}...</p>}
                    </div>
                    <AnimatePresence>
                      {isOpen && report && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                            <div className="pt-3 prose prose-sm dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report}</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
