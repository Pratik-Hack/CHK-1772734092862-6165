"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WaveformCanvas } from "@/components/heart/WaveformCanvas";
import { ECGCanvas } from "@/components/heart/ECGCanvas";
import { HeartRateCanvas } from "@/components/heart/HeartRateCanvas";
import { motion } from "framer-motion";
import Link from "next/link";
import type { CardioResult } from "@/models";

export default function HeartResultsPage() {
  const [result, setResult] = useState<CardioResult | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("heartResult");
    if (data) {
      try { setResult(JSON.parse(data)); } catch { /* invalid */ }
    }
  }, []);

  if (!result) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No results available.</p>
          <Link href="/patient/heart" className="text-[#FF6B35] font-semibold hover:underline">
            Record or upload a heart sound
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isNormal = result.prediction?.toLowerCase().includes("normal");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">CardioScope Results</h1>
            <p className="text-sm text-gray-500">AI heart sound analysis complete</p>
          </div>
        </motion.div>

        {/* Top stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Prediction Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-5 border ${
              isNormal
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${isNormal ? "bg-emerald-500" : "bg-red-500"} animate-pulse`} />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Classification</span>
            </div>
            <p className={`text-lg font-bold ${isNormal ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
              {result.prediction}
            </p>
          </motion.div>

          {/* Heart Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💓</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Heart Rate</span>
            </div>
            <p className="text-3xl font-bold text-[#FF6B35]">
              {result.avg_heart_rate ?? "--"}
              <span className="text-sm font-normal text-gray-500 ml-1">BPM</span>
            </p>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
            </div>
            <p className="text-lg font-bold">
              {isNormal ? (
                <span className="text-emerald-600 dark:text-emerald-400">Healthy</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Needs Attention</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">Consult your doctor for confirmation</p>
          </motion.div>
        </div>

        {/* Dashboard grid: graphs left, info right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main graphs column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Real-time Heart Sound Waveform */}
            {result.audio_waveform && result.audio_waveform.amplitude?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Heart Sound Waveform (Real-Time)
                </h2>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                  <WaveformCanvas
                    data={result.audio_waveform.amplitude}
                    color="#10b981"
                    height={150}
                    speed={0.8}
                  />
                </div>
              </motion.div>
            )}

            {/* Static Waveform */}
            {result.audio_waveform && result.audio_waveform.amplitude?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3">Heart Sound Waveform (Full)</h2>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                  <WaveformCanvas
                    data={result.audio_waveform.amplitude}
                    color="#6b7280"
                    height={120}
                    speed={0}
                  />
                </div>
              </motion.div>
            )}

            {/* ECG Graph */}
            {result.ecg_data && result.ecg_data.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  ECG Pattern
                </h2>
                <ECGCanvas data={result.ecg_data} height={200} speed={1} />
              </motion.div>
            )}

            {/* Heart Rate Over Time */}
            {result.heart_rate_data && result.heart_rate_data.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse" />
                  Heart Rate Over Time
                </h2>
                <HeartRateCanvas data={result.heart_rate_data} height={250} speed={0.08} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Health Insight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-2xl p-5 border ${
                isNormal
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              }`}
            >
              <h3 className="font-semibold text-sm mb-2">AI Health Insight</h3>
              <p className={`text-sm ${isNormal ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                {isNormal
                  ? "Your heart sounds are within normal range. Keep maintaining a healthy lifestyle with regular exercise and balanced nutrition."
                  : `Analysis detected: ${result.prediction}. Please schedule an appointment with your cardiologist for further evaluation and confirm these findings with a professional examination.`}
              </p>
            </motion.div>

            {/* Vitals Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3">Vitals Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Heart Rate</span>
                  <span className="font-bold text-[#FF6B35]">{result.avg_heart_rate ?? "--"} BPM</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Classification</span>
                  <span className={`font-semibold text-sm ${isNormal ? "text-emerald-600" : "text-red-600"}`}>{result.prediction}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Data Points</span>
                  <span className="font-medium text-sm">{result.heart_rate_data?.length ?? 0}</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">ECG Samples</span>
                  <span className="font-medium text-sm">{result.ecg_data?.length ?? 0}</span>
                </div>
              </div>
            </motion.div>

            {/* Weekly Tip */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass rounded-2xl p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-sm mb-2">💡 Weekly Tip</h3>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Regular monitoring of your heart sounds can help detect early signs of cardiovascular issues. Try recording weekly for better trend analysis.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/patient/heart"
            className="flex-1 py-3 text-center border border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            New Recording
          </Link>
          <Link
            href="/patient/dashboard"
            className="flex-1 py-3 text-center bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
