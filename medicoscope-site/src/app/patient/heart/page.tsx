"use client";

import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cardioService } from "@/services/cardio.service";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function HeartPage() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => { setAudioBlob(new Blob(chunksRef.current, { type: "audio/webm" })); stream.getTracks().forEach(t => t.stop()); };
      mediaRecorder.start();
      setRecording(true);
      setTimeout(() => { if (mediaRecorderRef.current?.state === "recording") { mediaRecorderRef.current.stop(); setRecording(false); } }, 30000);
    } catch { toast.error("Microphone access required"); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const analyze = async () => {
    if (!audioBlob) return;
    setAnalyzing(true);
    try {
      const file = new File([audioBlob], "heart-sound.webm", { type: audioBlob.type });
      const result = await cardioService.analyzeHeartSound(file);
      sessionStorage.setItem("heartResult", JSON.stringify(result.data || result));
      router.push("/patient/heart/results");
    } catch { toast.error("Analysis failed"); }
    finally { setAnalyzing(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">CardioScope</h1>
          <p className="text-gray-500 mt-1">Record or upload heart sounds for AI analysis</p>
        </motion.div>
        <div className="glass rounded-2xl p-8 text-center space-y-6">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${recording ? "animate-pulse bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
            <span className="text-5xl">{recording ? "🔴" : "❤️"}</span>
          </div>
          <div className="flex gap-3 justify-center">
            {!recording ? (
              <button onClick={startRecording} className="px-6 py-3 gradient-primary text-white rounded-xl font-semibold">🎤 Record Heart Sound</button>
            ) : (
              <button onClick={stopRecording} className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold">⏹ Stop Recording</button>
            )}
            <button onClick={() => fileRef.current?.click()} className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">📁 Upload Audio</button>
            <input ref={fileRef} type="file" accept="audio/*" onChange={e => { if (e.target.files?.[0]) setAudioBlob(e.target.files[0]); }} className="hidden" />
          </div>
          {audioBlob && (
            <div className="space-y-3">
              <p className="text-sm text-green-500">✓ Audio ready ({(audioBlob.size / 1024).toFixed(1)} KB)</p>
              <button onClick={analyze} disabled={analyzing} className="px-8 py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50">{analyzing ? "Analyzing..." : "Analyze Heart Sound"}</button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
