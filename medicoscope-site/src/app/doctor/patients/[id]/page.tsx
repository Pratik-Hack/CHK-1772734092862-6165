"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { detectionService } from "@/services/detection.service";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { formatDate, getConfidenceColor } from "@/lib/utils";

export default function PatientDetailPage() {
  const { id } = useParams();
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) detectionService.getPatientDetections(id as string).then(res => setDetections(Array.isArray(res) ? res : [])).catch(() => {}).finally(() => setLoading(false)); }, [id]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Patient Details</h1>
        <p className="text-gray-500">Patient ID: {id}</p>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Detection History</h2>
          {loading ? <p className="text-gray-400">Loading...</p> : detections.length === 0 ? (<p className="text-gray-400">No detections found</p>) : (
            <div className="space-y-3">
              {detections.map((det, i) => (
                <motion.div key={det._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div><p className="font-medium">{det.result || det.condition}</p><p className="text-sm text-gray-500">{det.category} · {formatDate(det.createdAt)}</p></div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(det.confidence)}`}>{det.confidence?.toFixed(1)}%</div>
                  </div>
                  {det.description && <p className="text-sm text-gray-500 mt-2">{det.description}</p>}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
