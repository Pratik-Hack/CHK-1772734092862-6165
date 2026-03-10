"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { motion } from "framer-motion";
import Link from "next/link";
import { getConfidenceColor } from "@/lib/utils";

export default function ScanResultsPage() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("scanResult");
    if (data) setResult(JSON.parse(data));
  }, []);

  if (!result) return <DashboardLayout><div className="text-center py-20 text-gray-500">No results found. <Link href="/patient/scan" className="text-[#FF6B35]">Go to scan</Link></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
          <h1 className="text-2xl font-bold mb-4">Scan Results</h1>
          <div className="space-y-4">
            <div><p className="text-sm text-gray-500">Detected Condition</p><p className="text-xl font-bold">{result.condition}</p></div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Confidence</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div className={`h-3 rounded-full ${getConfidenceColor(result.confidence)}`} style={{ width: `${result.confidence}%` }} />
              </div>
              <p className="text-sm font-semibold mt-1">{result.confidence.toFixed(1)}%</p>
            </div>
            <div><p className="text-sm text-gray-500">Description</p><p className="mt-1">{result.description}</p></div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Recommendations</p>
              <ul className="space-y-2">{result.recommendations?.map((rec: string, i: number) => (<li key={i} className="flex items-start gap-2"><span className="text-[#FF6B35]">•</span><span className="text-sm">{rec}</span></li>))}</ul>
            </div>
          </div>
        </motion.div>
        <div className="flex gap-3">
          <Link href="/patient/scan" className="flex-1 py-3 text-center border border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800">New Scan</Link>
          <Link href="/patient/dashboard" className="flex-1 py-3 text-center gradient-primary text-white rounded-xl font-medium">Dashboard</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
