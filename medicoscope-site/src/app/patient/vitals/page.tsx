"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useVitalsStore } from "@/stores/vitalsStore";
import { useAuthStore } from "@/stores/authStore";
import { vitalsService } from "@/services/vitals.service";
import { authService } from "@/services/auth.service";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { VitalAlert } from "@/models";

// Medical thresholds matching mobile app
const THRESHOLDS = {
  heartRate: { criticalLow: 40, warningLow: 50, warningHigh: 130, criticalHigh: 160, unit: "BPM" },
  systolic: { criticalLow: 70, warningLow: 90, warningHigh: 150, criticalHigh: 180, unit: "mmHg" },
  diastolic: { criticalLow: 40, warningLow: 60, warningHigh: 95, criticalHigh: 110, unit: "mmHg" },
  spO2: { criticalLow: 88, warningLow: 92, unit: "%" },
};

const SUDDEN_CHANGE = { heartRate: 30, bloodPressure: 30, spO2: 4 };
const COOLDOWN_THRESHOLD = 30000;
const COOLDOWN_SUDDEN = 20000;

interface VitalInput {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  spO2: number;
}

function checkThresholds(
  vital: VitalInput,
  prevVital: VitalInput | null,
  cooldowns: Record<string, number>
): VitalAlert[] {
  const alerts: VitalAlert[] = [];
  const now = Date.now();

  const addAlert = (key: string, alert: Partial<VitalAlert>, cooldown: number) => {
    if (cooldowns[key] && now - cooldowns[key] < cooldown) return;
    cooldowns[key] = now;
    alerts.push({ severity: "warning", message: "", timestamp: new Date().toISOString(), ...alert } as VitalAlert);
  };

  const hr = vital.heartRate;
  if (hr < THRESHOLDS.heartRate.criticalLow || hr > THRESHOLDS.heartRate.criticalHigh) {
    addAlert("hr_critical", { type: "threshold_breach", vitalType: "heart rate", severity: "critical", message: `Critical heart rate: ${hr} BPM`, value: hr, unit: "BPM", threshold: hr < THRESHOLDS.heartRate.criticalLow ? THRESHOLDS.heartRate.criticalLow : THRESHOLDS.heartRate.criticalHigh }, COOLDOWN_THRESHOLD);
  } else if (hr < THRESHOLDS.heartRate.warningLow || hr > THRESHOLDS.heartRate.warningHigh) {
    addAlert("hr_warning", { type: "threshold_breach", vitalType: "heart rate", severity: "warning", message: `Abnormal heart rate: ${hr} BPM`, value: hr, unit: "BPM", threshold: hr < THRESHOLDS.heartRate.warningLow ? THRESHOLDS.heartRate.warningLow : THRESHOLDS.heartRate.warningHigh }, COOLDOWN_THRESHOLD);
  }

  const sys = vital.bloodPressure.systolic;
  if (sys < THRESHOLDS.systolic.criticalLow || sys > THRESHOLDS.systolic.criticalHigh) {
    addAlert("sys_critical", { type: "threshold_breach", vitalType: "systolic BP", severity: "critical", message: `Critical systolic BP: ${sys} mmHg`, value: sys, unit: "mmHg", threshold: sys < THRESHOLDS.systolic.criticalLow ? THRESHOLDS.systolic.criticalLow : THRESHOLDS.systolic.criticalHigh }, COOLDOWN_THRESHOLD);
  } else if (sys < THRESHOLDS.systolic.warningLow || sys > THRESHOLDS.systolic.warningHigh) {
    addAlert("sys_warning", { type: "threshold_breach", vitalType: "systolic BP", severity: "warning", message: `Abnormal systolic BP: ${sys} mmHg`, value: sys, unit: "mmHg", threshold: sys < THRESHOLDS.systolic.warningLow ? THRESHOLDS.systolic.warningLow : THRESHOLDS.systolic.warningHigh }, COOLDOWN_THRESHOLD);
  }

  const dia = vital.bloodPressure.diastolic;
  if (dia < THRESHOLDS.diastolic.criticalLow || dia > THRESHOLDS.diastolic.criticalHigh) {
    addAlert("dia_critical", { type: "threshold_breach", vitalType: "diastolic BP", severity: "critical", message: `Critical diastolic BP: ${dia} mmHg`, value: dia, unit: "mmHg", threshold: dia < THRESHOLDS.diastolic.criticalLow ? THRESHOLDS.diastolic.criticalLow : THRESHOLDS.diastolic.criticalHigh }, COOLDOWN_THRESHOLD);
  } else if (dia < THRESHOLDS.diastolic.warningLow || dia > THRESHOLDS.diastolic.warningHigh) {
    addAlert("dia_warning", { type: "threshold_breach", vitalType: "diastolic BP", severity: "warning", message: `Abnormal diastolic BP: ${dia} mmHg`, value: dia, unit: "mmHg", threshold: dia < THRESHOLDS.diastolic.warningLow ? THRESHOLDS.diastolic.warningLow : THRESHOLDS.diastolic.warningHigh }, COOLDOWN_THRESHOLD);
  }

  const spo2 = vital.spO2;
  if (spo2 < THRESHOLDS.spO2.criticalLow) {
    addAlert("spo2_critical", { type: "threshold_breach", vitalType: "SpO2", severity: "critical", message: `Critical SpO2: ${spo2}%`, value: spo2, unit: "%", threshold: THRESHOLDS.spO2.criticalLow }, COOLDOWN_THRESHOLD);
  } else if (spo2 < THRESHOLDS.spO2.warningLow) {
    addAlert("spo2_warning", { type: "threshold_breach", vitalType: "SpO2", severity: "warning", message: `Low SpO2: ${spo2}%`, value: spo2, unit: "%", threshold: THRESHOLDS.spO2.warningLow }, COOLDOWN_THRESHOLD);
  }

  if (prevVital) {
    const hrChange = Math.abs(hr - prevVital.heartRate);
    if (hrChange > SUDDEN_CHANGE.heartRate) {
      addAlert("hr_sudden", { type: "sudden_change", vitalType: "heart rate", severity: "high", message: `Sudden heart rate change: ${prevVital.heartRate} -> ${hr} BPM`, value: hr, unit: "BPM" }, COOLDOWN_SUDDEN);
    }
    const sysChange = Math.abs(sys - prevVital.bloodPressure.systolic);
    if (sysChange > SUDDEN_CHANGE.bloodPressure) {
      addAlert("sys_sudden", { type: "sudden_change", vitalType: "systolic BP", severity: "high", message: `Sudden BP change: ${prevVital.bloodPressure.systolic} -> ${sys} mmHg`, value: sys, unit: "mmHg" }, COOLDOWN_SUDDEN);
    }
    const spo2Change = prevVital.spO2 - spo2;
    if (spo2Change > SUDDEN_CHANGE.spO2) {
      addAlert("spo2_sudden", { type: "sudden_change", vitalType: "SpO2", severity: "high", message: `Sudden SpO2 drop: ${prevVital.spO2}% -> ${spo2}%`, value: spo2, unit: "%" }, COOLDOWN_SUDDEN);
    }
  }

  return alerts;
}

export default function VitalsPage() {
  const { isMonitoring, dataPoints, alerts, duration, setMonitoring, addDataPoint, addAlert, setSessionId } = useVitalsStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [hasCritical, setHasCritical] = useState(false);
  const [linkedDoctorId, setLinkedDoctorId] = useState<string | null>(null);
  const cooldownsRef = useRef<Record<string, number>>({});
  const prevVitalRef = useRef<VitalInput | null>(null);

  useEffect(() => {
    authService.getLinkedDoctor?.().then((doc: any) => { if (doc?._id || doc?.id) setLinkedDoctorId(doc._id || doc.id); }).catch(() => {});
  }, []);

  const generateVital = useCallback(() => {
    return { heartRate: Math.round(60 + Math.random() * 40), bloodPressure: { systolic: Math.round(110 + Math.random() * 30), diastolic: Math.round(70 + Math.random() * 20) }, spO2: Math.round((94 + Math.random() * 6) * 10) / 10, temperature: Math.round((36.1 + Math.random() * 1.5) * 10) / 10, timestamp: new Date().toISOString() };
  }, []);

  const pollInterval = hasCritical ? 800 : 2000;

  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(async () => {
      const vital = generateVital();
      addDataPoint(vital);

      const clientAlerts = checkThresholds(vital, prevVitalRef.current, cooldownsRef.current);
      let newCritical = false;
      clientAlerts.forEach((a) => {
        addAlert(a);
        if (a.severity === "critical" || a.severity === "high") {
          newCritical = true;
          toast.error(`${a.message}`, { duration: 5000 });
        } else {
          toast(a.message, { icon: "⚠️", duration: 3000 });
        }
      });
      setHasCritical(newCritical);
      prevVitalRef.current = vital;

      try {
        const res = await vitalsService.tick({ ...vital, patientId: user?.id || "", doctorId: linkedDoctorId || undefined });
        if (res.alerts?.length) {
          res.alerts.forEach((a: VitalAlert) => {
            const isDuplicate = clientAlerts.some(ca => ca.vitalType === a.vitalType && ca.type === a.type);
            if (!isDuplicate) { addAlert(a); toast.error(`Alert: ${a.message}`); }
          });
        }
      } catch {}
    }, pollInterval);
    return () => clearInterval(interval);
  }, [isMonitoring, user, linkedDoctorId, generateVital, addDataPoint, addAlert, pollInterval]);

  const startMonitoring = async () => {
    if (!user?.id) { toast.error("Not logged in"); return; }
    setLoading(true);
    cooldownsRef.current = {};
    prevVitalRef.current = null;
    setHasCritical(false);
    try { const res = await vitalsService.startSession(user.id); setSessionId(res.sessionId); setMonitoring(true); toast.success("Monitoring started"); }
    catch { toast.error("Failed to start"); } finally { setLoading(false); }
  };

  const stopMonitoring = async () => {
    if (!user?.id) return;
    try {
      await vitalsService.stopSession(user.id);
      if (dataPoints.length > 0) {
        try {
          await vitalsService.saveSummary({
            patientId: user.id, doctorId: linkedDoctorId || undefined, duration,
            totalDataPoints: dataPoints.length, totalAlerts: alerts.length,
            criticalAlerts: alerts.filter(a => a.severity === "critical" || a.severity === "high").length,
            averages: {
              heartRate: Math.round(dataPoints.reduce((s, d) => s + d.heartRate, 0) / dataPoints.length),
              systolic: Math.round(dataPoints.reduce((s, d) => s + (d.bloodPressure?.systolic || d.systolic || 0), 0) / dataPoints.length),
              diastolic: Math.round(dataPoints.reduce((s, d) => s + (d.bloodPressure?.diastolic || d.diastolic || 0), 0) / dataPoints.length),
              spO2: Math.round(dataPoints.reduce((s, d) => s + d.spO2, 0) / dataPoints.length * 10) / 10,
            },
          });
        } catch {}
      }
      setMonitoring(false);
      toast.success("Monitoring stopped");
    } catch { toast.error("Failed to stop"); }
  };

  const latestVital = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1] : null;
  const criticalCount = alerts.filter(a => a.severity === "critical" || a.severity === "high").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Vitals Monitor</h1>
          <p className="text-gray-500 mt-1">Real-time health vitals tracking with AI alerts</p>
        </motion.div>

        <div className="flex gap-3 items-center flex-wrap">
          {!isMonitoring ? (
            <button onClick={startMonitoring} disabled={loading} className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50">{loading ? "Starting..." : "Start Monitoring"}</button>
          ) : (
            <button onClick={stopMonitoring} className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">Stop Monitoring</button>
          )}
          {isMonitoring && (
            <span className="flex items-center gap-2 text-green-500 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live · {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
              {hasCritical && <span className="ml-2 text-red-500 font-medium animate-pulse">URGENT MODE</span>}
            </span>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 text-center border-l-4 border-blue-500"><p className="text-2xl font-bold">{alerts.length}</p><p className="text-xs text-gray-500">Total Alerts</p></div>
            <div className="glass rounded-xl p-3 text-center border-l-4 border-red-500"><p className="text-2xl font-bold text-red-500">{criticalCount}</p><p className="text-xs text-gray-500">Critical/High</p></div>
            <div className="glass rounded-xl p-3 text-center border-l-4 border-green-500"><p className="text-2xl font-bold">{dataPoints.length}</p><p className="text-xs text-gray-500">Data Points</p></div>
          </div>
        )}

        {latestVital && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Heart Rate", value: `${latestVital.heartRate} bpm`, icon: "❤️", warn: latestVital.heartRate < THRESHOLDS.heartRate.warningLow || latestVital.heartRate > THRESHOLDS.heartRate.warningHigh },
                { label: "Blood Pressure", value: `${latestVital.bloodPressure?.systolic}/${latestVital.bloodPressure?.diastolic}`, icon: "🩸", warn: (latestVital.bloodPressure?.systolic || 0) > THRESHOLDS.systolic.warningHigh || (latestVital.bloodPressure?.systolic || 0) < THRESHOLDS.systolic.warningLow },
                { label: "SpO2", value: `${latestVital.spO2}%`, icon: "🫁", warn: latestVital.spO2 < THRESHOLDS.spO2.warningLow },
                { label: "Temperature", value: `${latestVital.temperature}°C`, icon: "🌡️", warn: false },
              ].map(v => (
                <div key={v.label} className={`glass rounded-xl p-4 ${v.warn ? "ring-2 ring-red-500/50 bg-red-50/10" : ""}`}>
                  <span className="text-2xl">{v.icon}</span>
                  <p className="text-sm text-gray-500 mt-1">{v.label}</p>
                  <p className={`text-xl font-bold ${v.warn ? "text-red-500" : ""}`}>{v.value}</p>
                </div>
              ))}
            </div>
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Heart Rate Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataPoints.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="timestamp" tick={false} /><YAxis domain={[40, 160]} /><Tooltip />
                  <Line type="monotone" dataKey="heartRate" stroke="#FF6B35" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">SpO2 Trend</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dataPoints.slice(-20)}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="timestamp" tick={false} /><YAxis domain={[85, 100]} /><Tooltip />
                  <Line type="monotone" dataKey="spO2" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {alerts.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">Recent Alerts</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {alerts.slice(0, 20).map((alert, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                  alert.severity === "critical" || alert.severity === "high" ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500" :
                  alert.severity === "warning" ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500" :
                  "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                }`}>
                  <span>{alert.severity === "critical" || alert.severity === "high" ? "🚨" : "⚠️"}</span>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message || "Abnormal vital detected"}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span className={`px-1.5 py-0.5 rounded ${
                        alert.severity === "critical" || alert.severity === "high" ? "bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300" : "bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300"
                      }`}>{alert.severity}</span>
                      {alert.vitalType && <span>{alert.vitalType}</span>}
                      {alert.value != null && <span>{alert.value} {alert.unit}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
