"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mentalHealthService } from "@/services/mental-health.service";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function MindSpaceHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { mentalHealthService.getHistory().then(res => { setSessions(Array.isArray(res) ? res : []); }).catch(() => toast.error("Failed to load history")).finally(() => setLoading(false)); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try { await mentalHealthService.deleteSession(id); setSessions(prev => prev.filter(s => s._id !== id && s.id !== id)); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

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
            {sessions.map((session, i) => {
              const sid = session._id || session.id || String(i);
              const isOpen = expandedId === sid;
              const result = session.result || {};
              return (
                <motion.div key={sid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl cursor-pointer hover:ring-1 hover:ring-purple-400/30 transition-all"
                  onClick={() => toggle(sid)}>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{result.mood || result.emotion || "Session"}</p>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(session.createdAt || session.timestamp)}</p>
                      </div>
                    </div>
                    <button onClick={(e) => handleDelete(e, sid)} className="text-red-500 hover:text-red-600 text-sm">Delete</button>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                          <div className="pt-3 space-y-2 text-sm">
                            {result.mood && <div className="flex gap-2"><span className="text-gray-500 w-28">Mood:</span><span className="font-medium">{result.mood}</span></div>}
                            {result.emotion && <div className="flex gap-2"><span className="text-gray-500 w-28">Emotion:</span><span className="font-medium">{result.emotion}</span></div>}
                            {result.stressLevel && <div className="flex gap-2"><span className="text-gray-500 w-28">Stress Level:</span><span className="font-medium">{result.stressLevel}</span></div>}
                            {result.confidence && <div className="flex gap-2"><span className="text-gray-500 w-28">Confidence:</span><span>{typeof result.confidence === "number" ? `${result.confidence.toFixed(1)}%` : result.confidence}</span></div>}
                            {result.suggestions && (
                              <div>
                                <p className="text-gray-500 mb-1">Suggestions:</p>
                                <ul className="ml-4 space-y-1">{(Array.isArray(result.suggestions) ? result.suggestions : [result.suggestions]).map((s: string, j: number) => (
                                  <li key={j} className="text-gray-600 dark:text-gray-400">• {s}</li>
                                ))}</ul>
                              </div>
                            )}
                            {result.transcript && <div><p className="text-gray-500 mb-1">Transcript:</p><p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{result.transcript}</p></div>}
                            <div className="flex gap-2"><span className="text-gray-500 w-28">Date:</span><span>{formatDate(session.createdAt || session.timestamp)}</span></div>
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
