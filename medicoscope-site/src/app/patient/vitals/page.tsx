"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useVitalsStore } from "@/stores/vitalsStore";
import { useAuthStore } from "@/stores/authStore";
import { vitalsService } from "@/services/vitals.service";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function VitalsPage() {
  const { isMonitoring, dataPoints, alerts, duration, setMonitoring, addDataPoint, addAlert, setSessionId } = useVitalsStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const generateVital = useCallback(() => {
    return { heartRate: Math.round(60 + Math.random() * 40), bloodPressure: { systolic: Math.round(110 + Math.random() * 30), diastolic: Math.round(70 + Math.random() * 20) }, spO2: Math.round((94 + Math.random() * 6) * 10) / 10, temperature: Math.round((36.1 + Math.random() * 1.5) * 10) / 10, timestamp: new Date().toISOString() };
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(async () => {
      const vital = generateVital();
      addDataPoint(vital);
      try {
        const res = await vitalsService.tick({ ...vital, patientId: user?._id || "" });
        if (res.alerts?.length) res.alerts.forEach((a: any) => { addAlert(a); toast.error(`Alert: ${a.message}`); });
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [isMonitoring, user, generateVital, addDataPoint, addAlert]);

  const startMonitoring = async () => {
    setLoading(true);
    try { const res = await vitalsService.startSession(user?._id || ""); setSessionId(res.sessionId); setMonitoring(true); toast.success("Monitoring started"); }
    catch { toast.error("Failed to start"); } finally { setLoading(false); }
  };

  const stopMonitoring = async () => {
    try { await vitalsService.stopSession(user?._id || ""); setMonitoring(false); toast.success("Monitoring stopped"); }
    catch { toast.error("Failed to stop"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Vitals Monitor</h1>
          <p className="text-gray-500 mt-1">Real-time health vitals tracking</p>
        </motion.div>
        <div className="flex gap-3">
          {!isMonitoring ? (
            <button onClick={startMonitoring} disabled={loading} className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50">{loading ? "Starting..." : "Start Monitoring"}</button>
          ) : (
            <button onClick={stopMonitoring} className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">Stop Monitoring</button>
          )}
          {isMonitoring && <span className="flex items-center gap-2 text-green-500 text-sm"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live · {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}</span>}
        </div>
        {dataPoints.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Heart Rate", value: `${dataPoints[dataPoints.length - 1]?.heartRate} bpm`, icon: "❤️" },
                { label: "Blood Pressure", value: `${dataPoints[dataPoints.length - 1]?.bloodPressure?.systolic}/${dataPoints[dataPoints.length - 1]?.bloodPressure?.diastolic}`, icon: "🩸" },
                { label: "SpO2", value: `${dataPoints[dataPoints.length - 1]?.spO2}%`, icon: "🫁" },
                { label: "Temperature", value: `${dataPoints[dataPoints.length - 1]?.temperature}°C`, icon: "🌡️" },
              ].map(v => (<div key={v.label} className="glass rounded-xl p-4"><span className="text-2xl">{v.icon}</span><p className="text-sm text-gray-500 mt-1">{v.label}</p><p className="text-xl font-bold">{v.value}</p></div>))}
            </div>
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Heart Rate Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataPoints.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="timestamp" tick={false} /><YAxis domain={[40, 120]} /><Tooltip />
                  <Line type="monotone" dataKey="heartRate" stroke="#FF6B35" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {alerts.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">Alerts</h2>
            <div className="space-y-2">{alerts.map((alert, i) => (<div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"><span>⚠️</span> {alert.message || "Abnormal vital detected"}</div>))}</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
