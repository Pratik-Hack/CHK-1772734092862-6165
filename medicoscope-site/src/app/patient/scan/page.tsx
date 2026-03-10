"use client";

import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SCAN_CATEGORIES } from "@/lib/constants";
import { detectionService } from "@/services/detection.service";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ScanPage() {
  const [selectedCategory, setSelectedCategory] = useState(SCAN_CATEGORIES[0]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleFile = (file: File) => {
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) { toast.error("Please select an image"); return; }
    setAnalyzing(true);
    try {
      const mockResult = {
        condition: selectedCategory === "Chest X-Ray" ? "Pneumonia" : selectedCategory === "Brain MRI" ? "Normal Brain Scan" : "Skin Lesion Detected",
        confidence: Math.random() * 30 + 70,
        description: `Analysis of ${selectedCategory} image completed. AI detected patterns consistent with the identified condition.`,
        recommendations: ["Consult a specialist", "Schedule follow-up", "Monitor symptoms"],
      };
      await detectionService.saveDetection({ patientId: user?.id || "", imageUrl: preview || "", category: selectedCategory, result: mockResult.condition, confidence: mockResult.confidence, description: mockResult.description });
      sessionStorage.setItem("scanResult", JSON.stringify(mockResult));
      router.push("/patient/scan/results");
    } catch { toast.error("Analysis failed"); }
    finally { setAnalyzing(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">AI Medical Scan</h1>
          <p className="text-gray-500 mt-1">Upload or capture a medical image for AI analysis</p>
        </motion.div>
        <div className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Scan Category</label>
            <div className="flex flex-wrap gap-2">
              {SCAN_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? "gradient-primary text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center">
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl" />
                <button onClick={() => { setImage(null); setPreview(null); }} className="text-sm text-red-500">Remove</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl">📸</div>
                <p className="text-gray-500">Upload or capture a medical image</p>
                <button onClick={() => fileRef.current?.click()} className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium">Upload Image</button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </div>
          <button onClick={handleAnalyze} disabled={!image || analyzing} className="w-full py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50">
            {analyzing ? "Analyzing..." : "Analyze Image"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
