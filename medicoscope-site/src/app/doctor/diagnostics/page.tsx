"use client";

import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { detectionService } from "@/services/detection.service";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function DiagnosticsPage() {
  const [category, setCategory] = useState("Chest X-Ray");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const handleFile = (file: File) => { setImage(file); const reader = new FileReader(); reader.onloadend = () => setPreview(reader.result as string); reader.readAsDataURL(file); };

  const analyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const res = await detectionService.analyzeImage(image, category);
      setResult({
        condition: res.className || "Analysis Complete",
        confidence: res.confidence ?? 0,
        description: res.description || `AI analysis of ${category} complete.`,
        recommendations: ["Confirm with laboratory tests", "Schedule follow-up imaging", "Consider specialist referral"],
      });
      toast.success("Analysis complete");
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Diagnostics</h1>
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex gap-3">
            {["Chest X-Ray", "Brain MRI", "Skin Lesion", "Eye/Fundus"].map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium ${category === cat ? "gradient-primary text-white" : "bg-gray-100 dark:bg-gray-800"}`}>{cat}</button>))}
          </div>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center">
            {preview ? (<div className="space-y-3"><img src={preview} alt="Scan" className="max-h-64 mx-auto rounded-xl" /><button onClick={() => { setImage(null); setPreview(null); setResult(null); }} className="text-sm text-red-500">Remove</button></div>) : (
              <div className="space-y-3"><span className="text-4xl block">🔬</span><button onClick={() => fileRef.current?.click()} className="px-4 py-2 gradient-primary text-white rounded-xl text-sm">Upload Scan</button></div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </div>
          {image && !result && (<button onClick={analyze} disabled={analyzing} className="w-full py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50">{analyzing ? "Analyzing..." : "Run Diagnostic"}</button>)}
        </div>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Results</h2>
            <div><p className="text-sm text-gray-500">Condition</p><p className="text-xl font-bold">{result.condition}</p></div>
            <div><p className="text-sm text-gray-500">Confidence</p><p className="font-semibold">{result.confidence.toFixed(1)}%</p></div>
            <div><p className="text-sm text-gray-500">Description</p><p className="text-sm mt-1">{result.description}</p></div>
            <div><p className="text-sm text-gray-500 mb-1">Recommendations</p><ul className="space-y-1">{result.recommendations.map((r: string, i: number) => <li key={i} className="text-sm">• {r}</li>)}</ul></div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
