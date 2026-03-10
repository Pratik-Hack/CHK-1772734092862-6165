"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { detectionService } from "@/services/detection.service";
import { usePolling } from "@/hooks/usePolling";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, getConfidenceColor } from "@/lib/utils";

export default function ReportsPage() {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: reports, loading } = usePolling(
    () => detectionService.getMyDetections().then(r => Array.isArray(r) ? r : []).catch(() => [] as any[]),
    20000,
    []
  );

  const list = reports ?? [];
  const filtered = filter === "all" ? list : list.filter(r => r.category === filter);
  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2 flex-wrap">
          {["all", "Chest X-Ray", "Brain MRI", "Skin Lesion"].map(f => (<button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium ${filter === f ? "gradient-primary text-white" : "bg-gray-100 dark:bg-gray-800"}`}>{f === "all" ? "All" : f}</button>))}
        </div>
        {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">📊</span><p>No reports found</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report, i) => {
              const rid = report._id || report.id || String(i);
              const isOpen = expandedId === rid;
              return (
                <motion.div key={rid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl cursor-pointer hover:ring-1 hover:ring-[#FF6B35]/30 transition-all"
                  onClick={() => toggle(rid)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{report.className || report.result || report.condition}</p>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <p className="text-sm text-gray-500">{report.category} · {formatDate(report.createdAt || report.timestamp)}</p>
                        {report.patientName && <p className="text-sm text-gray-500">Patient: {report.patientName}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(report.confidence)}`}>{report.confidence?.toFixed(1)}%</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                          <div className="pt-3 space-y-2 text-sm">
                            <div className="flex gap-2"><span className="text-gray-500 w-28">Classification:</span><span className="font-medium">{report.className || report.result || report.condition}</span></div>
                            <div className="flex gap-2"><span className="text-gray-500 w-28">Confidence:</span><span className="font-medium">{report.confidence?.toFixed(1)}%</span></div>
                            <div className="flex gap-2"><span className="text-gray-500 w-28">Category:</span><span>{report.category}</span></div>
                            {report.description && <div className="flex gap-2"><span className="text-gray-500 w-28 shrink-0">Description:</span><span>{report.description}</span></div>}
                            {(report.performedBy?.name || report.performedBy) && <div className="flex gap-2"><span className="text-gray-500 w-28">Performed By:</span><span>{typeof report.performedBy === "object" ? report.performedBy.name : report.performedBy}</span></div>}
                            <div className="flex gap-2"><span className="text-gray-500 w-28">Date:</span><span>{formatDate(report.createdAt || report.timestamp)}</span></div>
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
