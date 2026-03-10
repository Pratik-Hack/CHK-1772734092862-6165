"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { chatService } from "@/services/chat.service";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { chatService.getHistory().then(res => { setSessions(Array.isArray(res) ? res : []); }).catch(() => toast.error("Failed to load history")).finally(() => setLoading(false)); }, []);

  const handleDelete = async (id: string) => {
    try { await chatService.deleteSession(id); setSessions(prev => prev.filter(s => s._id !== id && s.id !== id)); toast.success("Deleted"); } catch { toast.error("Failed to delete"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Chat History</h1>
          <Link href="/patient/chat" className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium">New Chat</Link>
        </div>
        {loading ? (<div className="text-center py-20 text-gray-400">Loading...</div>) : sessions.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">💬</span><p>No chat history yet</p></div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <motion.div key={session._id || session.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4 flex items-center justify-between">
                <div><p className="font-medium">{session.messages?.[0]?.content?.slice(0, 50) || "Chat session"}...</p><p className="text-sm text-gray-500">{formatDate(session.createdAt)} · {session.messages?.length || 0} messages</p></div>
                <button onClick={() => handleDelete(session._id || session.id)} className="text-red-500 hover:text-red-600 text-sm">Delete</button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
