"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { detectionService } from "@/services/detection.service";
import { useParams } from "next/navigation";
import { usePolling } from "@/hooks/usePolling";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, getConfidenceColor } from "@/lib/utils";

export default function PatientDetailPage() {
  const { id } = useParams();
  const pid = (id as string) || "";
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: detections, loading } = usePolling(
    () => pid ? detectionService.getPatientDetections(pid).then(r => Array.isArray(r) ? r : []).catch(() => [] as any[]) : Promise.resolve([] as any[]),
    15000,
    [pid]
  );

  const list = detections ?? [];
  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Patient Details</h1>
        <p className="text-gray-500">Patient ID: {id}</p>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Detection History</h2>
          {loading ? <p className="text-gray-400">Loading...</p> : list.length === 0 ? (<p className="text-gray-400">No detections found</p>) : (
            <div className="space-y-3">
              {list.map((det, i) => {
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
      </div>
    </DashboardLayout>
  );
}
