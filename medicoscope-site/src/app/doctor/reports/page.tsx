"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { detectionService } from "@/services/detection.service";
import { motion } from "framer-motion";
import { formatDate, getConfidenceColor } from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { detectionService.getMyDetections().then(res => setReports(Array.isArray(res) ? res : res.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = filter === "all" ? reports : reports.filter(r => r.category === filter);

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
            {filtered.map((report, i) => (
              <motion.div key={report._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div><p className="font-semibold">{report.result || report.condition}</p><p className="text-sm text-gray-500">{report.category} · {formatDate(report.createdAt)}</p>{report.patientName && <p className="text-sm text-gray-500">Patient: {report.patientName}</p>}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(report.confidence)}`}>{report.confidence?.toFixed(1)}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
