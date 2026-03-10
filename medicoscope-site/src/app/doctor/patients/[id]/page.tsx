"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { detectionService } from "@/services/detection.service";
import { vitalsService } from "@/services/vitals.service";
import { useParams } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatDateTime, getConfidenceColor } from "@/lib/utils";

export default function PatientDetailPage() {
  const { id } = useParams();
  const pid = (id as string) || "";
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"detections" | "alerts">("detections");

  const { data: detections, loading: loadingDet } = usePolling(
    () => pid ? detectionService.getPatientDetections(pid).then(r => Array.isArray(r) ? r : []).catch(() => [] as any[]) : Promise.resolve([] as any[]),
    15000,
    [pid]
  );

  // Fetch patient's vital alerts for the doctor view
  const { data: patientAlerts, loading: loadingAlerts } = usePolling(
    () => pid ? vitalsService.getPatientAlerts(pid).then(r => Array.isArray(r) ? r : []).catch(() => [] as any[]) : Promise.resolve([] as any[]),
    10000,
    [pid]
  );

  const detList = detections ?? [];
  const alertList = patientAlerts ?? [];
  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const criticalAlerts = alertList.filter((a: any) => a.severity === "critical" || a.severity === "high");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Patient Details</h1>
        <p className="text-gray-500">Patient ID: {id}</p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{detList.length}</p>
            <p className="text-xs text-gray-500">Detections</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{alertList.length}</p>
            <p className="text-xs text-gray-500">Vital Alerts</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${criticalAlerts.length > 0 ? "text-red-500" : ""}`}>{criticalAlerts.length}</p>
            <p className="text-xs text-gray-500">Critical</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["detections", "alerts"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? "gradient-primary text-white" : "bg-gray-100 dark:bg-gray-800"}`}>
              {t === "detections" ? `🔬 Detections (${detList.length})` : `🔔 Vital Alerts (${alertList.length})`}
            </button>
          ))}
        </div>

        {tab === "detections" ? (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Detection History</h2>
            {loadingDet ? <p className="text-gray-400">Loading...</p> : detList.length === 0 ? (<p className="text-gray-400">No detections found</p>) : (
              <div className="space-y-3">
                {detList.map((det: any, i: number) => {
                  const did = det._id || det.id || String(i);
                  const isOpen = expandedId === did;
                  return (
                    <motion.div key={did} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:ring-1 hover:ring-[#FF6B35]/30 transition-all"
                      onClick={() => toggle(did)}>
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{det.className || det.result || det.condition}</p>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <p className="text-sm text-gray-500">{det.category} · {formatDate(det.createdAt || det.timestamp)}</p>
                          </div>
                          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(det.confidence)}`}>{det.confidence?.toFixed(1)}%</div>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                              <div className="pt-3 space-y-2 text-sm">
                                <div className="flex gap-2"><span className="text-gray-500 w-28">Classification:</span><span className="font-medium">{det.className || det.result || det.condition}</span></div>
                                <div className="flex gap-2"><span className="text-gray-500 w-28">Confidence:</span><span className="font-medium">{det.confidence?.toFixed(1)}%</span></div>
                                <div className="flex gap-2"><span className="text-gray-500 w-28">Category:</span><span>{det.category}</span></div>
                                {det.description && <div className="flex gap-2"><span className="text-gray-500 w-28 shrink-0">Description:</span><span>{det.description}</span></div>}
                                {(det.performedBy?.name || (typeof det.performedBy === "string" && det.performedBy)) && <div className="flex gap-2"><span className="text-gray-500 w-28">Performed By:</span><span>{typeof det.performedBy === "object" ? det.performedBy.name : det.performedBy}</span></div>}
                                <div className="flex gap-2"><span className="text-gray-500 w-28">Date:</span><span>{formatDate(det.createdAt || det.timestamp)}</span></div>
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
        ) : (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Vital Alerts</h2>
            {loadingAlerts ? <p className="text-gray-400">Loading...</p> : alertList.length === 0 ? (<p className="text-gray-400">No vital alerts</p>) : (
              <div className="space-y-3">
                {alertList.map((alert: any, i: number) => {
                  const aid = alert._id || String(i);
                  const isOpen = expandedId === `a-${aid}`;
                  const sevColor = alert.severity === "critical" || alert.severity === "high" ? "border-red-500" : alert.severity === "warning" || alert.severity === "medium" ? "border-yellow-500" : "border-blue-500";
                  return (
                    <motion.div key={aid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`rounded-xl bg-gray-50 dark:bg-gray-800/50 border-l-4 ${sevColor} cursor-pointer hover:ring-1 hover:ring-gray-400/30 transition-all`}
                      onClick={() => toggle(`a-${aid}`)}>
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span>{alert.severity === "critical" || alert.severity === "high" ? "🚨" : "⚠️"}</span>
                              <p className="font-medium">{alert.message || "Abnormal vital detected"}</p>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <p className="text-sm text-gray-500">{alert.vitalType || alert.vital || alert.type} · {formatDateTime(alert.createdAt || alert.timestamp)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.severity === "critical" || alert.severity === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                            alert.severity === "warning" || alert.severity === "medium" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}>{alert.severity}</span>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                              <div className="pt-3 space-y-2 text-sm">
                                {alert.severity && <div className="flex gap-2"><span className="text-gray-500 w-24">Severity:</span><span className="font-medium">{alert.severity}</span></div>}
                                {(alert.vitalType || alert.vital) && <div className="flex gap-2"><span className="text-gray-500 w-24">Vital Type:</span><span>{alert.vitalType || alert.vital || alert.type}</span></div>}
                                {alert.value != null && <div className="flex gap-2"><span className="text-gray-500 w-24">Value:</span><span className="font-medium">{alert.value} {alert.unit || ""}</span></div>}
                                {alert.threshold != null && <div className="flex gap-2"><span className="text-gray-500 w-24">Threshold:</span><span>{alert.threshold} {alert.unit || ""}</span></div>}
                                <div className="flex gap-2"><span className="text-gray-500 w-24">Time:</span><span>{formatDateTime(alert.createdAt || alert.timestamp)}</span></div>
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
        )}
      </div>
    </DashboardLayout>
  );
}
