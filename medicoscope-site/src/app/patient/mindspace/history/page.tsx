"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mentalHealthService } from "@/services/mental-health.service";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MindSpaceHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { mentalHealthService.getHistory().then(res => { setSessions(Array.isArray(res) ? res : res.data || []); }).catch(() => {}).finally(() => setLoading(false)); }, []);

  const handleDelete = async (id: string) => {
    try { await mentalHealthService.deleteSession(id); setSessions(prev => prev.filter(s => s._id !== id && s.id !== id)); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">MindSpace History</h1>
          <Link href="/patient/mindspace" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-medium">New Session</Link>
        </div>
        {loading ? (<div className="text-center py-20 text-gray-400">Loading...</div>) : sessions.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">🧠</span><p>No sessions yet</p></div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <motion.div key={session._id || session.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4 flex items-center justify-between">
                <div><p className="font-medium">{session.result?.mood || session.result?.emotion || "Session"}</p><p className="text-sm text-gray-500">{formatDate(session.createdAt || session.timestamp)}</p></div>
                <button onClick={() => handleDelete(session._id || session.id)} className="text-red-500 hover:text-red-600 text-sm">Delete</button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
