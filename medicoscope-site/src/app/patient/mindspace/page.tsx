"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mentalHealthService } from "@/services/mental-health.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { useCoinsStore } from "@/stores/coinsStore";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function MindSpacePage() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timer, setTimer] = useState(30);
  const [linkedDoctorId, setLinkedDoctorId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuthStore();
  const { addMindSpaceCoins } = useCoinsStore();

  // Fetch linked doctor so notifications reach the doctor
  useEffect(() => {
    authService.getLinkedDoctor?.().then((doc: any) => {
      if (doc?._id || doc?.id) setLinkedDoctorId(doc._id || doc.id);
    }).catch(() => {});
  }, []);

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
      setTimer(30);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) { mediaRecorderRef.current?.stop(); setRecording(false); if (timerRef.current) clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch { toast.error("Microphone access required"); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); if (timerRef.current) clearInterval(timerRef.current); };

  const analyze = async () => {
    if (!audioBlob) return;
    setAnalyzing(true);
    try {
      const file = new File([audioBlob], "mindspace.webm", { type: audioBlob.type });
      // Send doctorId so the doctor gets the mental health notification
      const res = await mentalHealthService.analyze(file, user?.id || "", user?.name, linkedDoctorId || undefined);
      setResult(res);
      addMindSpaceCoins();
      toast.success("Analysis complete! +5 coins earned");
      try { await mentalHealthService.saveSession({ userId: user?.id || "", result: res, doctorId: linkedDoctorId || undefined }); } catch {}
    } catch { toast.error("Analysis failed"); }
    finally { setAnalyzing(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">MindSpace</h1>
          <p className="text-gray-500 mt-1">Voice-based mental health check-in</p>
        </motion.div>
        <div className="glass rounded-2xl p-8 text-center space-y-6">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${recording ? "animate-pulse bg-purple-100 dark:bg-purple-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
            <span className="text-5xl">🧠</span>
          </div>
          {recording && <p className="text-3xl font-bold text-purple-500">{timer}s</p>}
          <p className="text-gray-500">Share how you&apos;re feeling by recording a 30-second voice note</p>
          <div className="flex gap-3 justify-center">
            {!recording ? (
              <button onClick={startRecording} disabled={!!result} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50">🎤 Start Recording</button>
            ) : (
              <button onClick={stopRecording} className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold">⏹ Stop</button>
            )}
          </div>
          {audioBlob && !result && (
            <button onClick={analyze} disabled={analyzing} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50">{analyzing ? "Analyzing..." : "Analyze My Mood"}</button>
          )}
        </div>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Your Mental Health Report</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20"><p className="text-sm text-gray-500">Mood</p><p className="text-lg font-bold">{result.mood || result.emotion || "Neutral"}</p></div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20"><p className="text-sm text-gray-500">Stress Level</p><p className="text-lg font-bold">{result.stressLevel || "Low"}</p></div>
            </div>
            {(result.urgency || result.urgencyLevel) && (
              <div className={`p-3 rounded-xl text-sm font-medium ${
                (result.urgency || result.urgencyLevel) === "high" ? "bg-red-50 dark:bg-red-900/20 text-red-600" :
                (result.urgency || result.urgencyLevel) === "medium" ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600" :
                "bg-green-50 dark:bg-green-900/20 text-green-600"
              }`}>
                Urgency: {result.urgency || result.urgencyLevel}
                {linkedDoctorId && <span className="ml-2 text-xs opacity-70">· Sent to your doctor</span>}
              </div>
            )}
            {result.suggestions && (<div><p className="text-sm font-medium mb-2">Suggestions</p><ul className="space-y-1">{(Array.isArray(result.suggestions) ? result.suggestions : [result.suggestions]).map((s: string, i: number) => (<li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {s}</li>))}</ul></div>)}
            {result.response && (<div><p className="text-sm font-medium mb-2">AI Response</p><p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{result.response}</p></div>)}
            <button onClick={() => { setResult(null); setAudioBlob(null); setTimer(30); }} className="w-full py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-medium">New Session</button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
