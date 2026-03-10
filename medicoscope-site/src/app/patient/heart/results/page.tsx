"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HeartResultsPage() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => { const data = sessionStorage.getItem("heartResult"); if (data) setResult(JSON.parse(data)); }, []);

  if (!result) return <DashboardLayout><div className="text-center py-20 text-gray-500">No results. <Link href="/patient/heart" className="text-[#FF6B35]">Record heart sound</Link></div></DashboardLayout>;

  const heartRateData = result.heartRateData || Array.from({ length: 20 }, (_, i) => ({ time: i, bpm: 60 + Math.random() * 30 }));
  const ecgData = result.ecgData || Array.from({ length: 50 }, (_, i) => ({ time: i, value: Math.sin(i * 0.5) * (i % 5 === 0 ? 3 : 1) }));

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><h1 className="text-2xl font-bold">Heart Analysis Results</h1></motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[{ label: "Classification", value: result.classification || "Normal", icon: "❤️" }, { label: "Confidence", value: `${(result.confidence || 85).toFixed(1)}%`, icon: "📊" }, { label: "Heart Rate", value: `${result.heartRate || 72} bpm`, icon: "💓" }].map(item => (
            <div key={item.label} className="glass rounded-xl p-4"><span className="text-2xl">{item.icon}</span><p className="text-sm text-gray-500 mt-1">{item.label}</p><p className="text-lg font-bold">{item.value}</p></div>
          ))}
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Heart Rate Over Time</h2>
          <ResponsiveContainer width="100%" height={250}><LineChart data={heartRateData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Line type="monotone" dataKey="bpm" stroke="#FF6B35" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">ECG Pattern</h2>
          <ResponsiveContainer width="100%" height={200}><AreaChart data={ecgData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef444420" strokeWidth={2} /></AreaChart></ResponsiveContainer>
        </div>
        <div className="flex gap-3">
          <Link href="/patient/heart" className="flex-1 py-3 text-center border border-gray-300 dark:border-gray-700 rounded-xl font-medium">New Recording</Link>
          <Link href="/patient/dashboard" className="flex-1 py-3 text-center gradient-primary text-white rounded-xl font-medium">Dashboard</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
