"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { cardioService } from "@/services/cardio.service";
import { WaveformCanvas } from "@/components/heart/WaveformCanvas";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Stage = "idle" | "ready" | "analyzing";

export default function HeartPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [previewData, setPreviewData] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const generatePreview = useCallback(async (blob: Blob) => {
    try {
      const ctx = new AudioContext();
      const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
      const raw = buf.getChannelData(0);
      const step = Math.max(1, Math.floor(raw.length / 2000));
      const samples: number[] = [];
      for (let i = 0; i < raw.length; i += step) samples.push(raw[i]);
      setPreviewData(samples);
    } catch {
      setPreviewData([]);
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setAudioBlob(file);
      setFileName(file.name);
      setStage("ready");
      generatePreview(file);
    },
    [generatePreview]
  );

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setRecordTime(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setFileName("Recording");
        setStage("ready");
        generatePreview(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);

      timerRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setRecording(false);
          clearInterval(timerRef.current);
        }
      }, 30000);
    } catch {
      toast.error("Microphone access is required");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const analyze = async () => {
    if (!audioBlob) return;
    setStage("analyzing");
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 300);

    try {
      const file =
        audioBlob instanceof File
          ? audioBlob
          : new File([audioBlob], "recording.wav", { type: audioBlob.type });
      const result = await cardioService.analyzeHeartSound(file);
      clearInterval(interval);
      setProgress(100);
      sessionStorage.setItem("heartResult", JSON.stringify(result));
      await new Promise((r) => setTimeout(r, 400));
      router.push("/patient/heart/results");
    } catch {
      clearInterval(interval);
      toast.error("Analysis failed. Please upload a valid .wav or .mp3 file.");
      setStage("ready");
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setFileName("");
    setStage("idle");
    setPreviewData([]);
    setProgress(0);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) handleFile(file);
      else toast.error("Please drop an audio file (.wav or .mp3)");
    },
    [handleFile]
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">CardioScope</h1>
            <p className="text-sm text-gray-500">AI-powered heart sound analysis</p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* IDLE / READY: Upload or Record */}
          {(stage === "idle" || stage === "ready") && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="glass rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#FF6B35] transition-colors text-center space-y-4"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>

                <div>
                  <p className="font-semibold text-lg">Upload Heart Sound</p>
                  <p className="text-sm text-gray-500 mt-1">Drag & drop your .wav or .mp3 file here, or use the buttons below</p>
                </div>

                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Browse Files
                  </button>

                  {!recording ? (
                    <button
                      onClick={startRecording}
                      className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
                    >
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      Record
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm animate-pulse flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                      Stop {formatTime(recordTime)}
                    </button>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".wav,.mp3,audio/wav,audio/mpeg"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                  className="hidden"
                />
              </div>

              {/* Audio Preview */}
              {stage === "ready" && audioBlob && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 space-y-4">
                  <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{fileName}</p>
                          <p className="text-xs text-gray-500">{(audioBlob.size / 1024).toFixed(1)} KB &bull; Ready for analysis</p>
                        </div>
                      </div>
                      <button onClick={reset} className="text-xs text-gray-400 hover:text-red-500 transition">Remove</button>
                    </div>

                    {previewData.length > 0 && (
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
                        <WaveformCanvas data={previewData} color="#ef4444" height={100} speed={1} label="Heart Sound Preview" />
                      </div>
                    )}

                    <button
                      onClick={analyze}
                      className="w-full py-3.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Analyze Heart Sound
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ANALYZING */}
          {stage === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass rounded-2xl p-10 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center animate-pulse">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold">Analyzing Heart Sound</h2>
                <p className="text-sm text-gray-500 mt-1">AI is processing your audio...</p>
              </div>

              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-red-500 to-pink-600 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">{Math.round(progress)}%</p>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                <span className={progress > 10 ? "text-green-500" : ""}>&#10003; Audio loaded</span>
                <span className={progress > 40 ? "text-green-500" : ""}>{progress > 40 ? "✓" : "○"} Feature extraction</span>
                <span className={progress > 70 ? "text-green-500" : ""}>{progress > 70 ? "✓" : "○"} AI Classification</span>
                <span className={progress >= 100 ? "text-green-500" : ""}>{progress >= 100 ? "✓" : "○"} Complete</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "🫀", title: "Heart Sound Analysis", desc: "Upload .wav heart recordings for AI classification" },
            { icon: "📊", title: "Real-Time Graphs", desc: "Live waveform, ECG, and heart rate visualizations" },
            { icon: "🧠", title: "AI-Powered", desc: "Deep learning model trained on cardiac audio data" },
          ].map((card) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 flex gap-3 items-start">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <p className="font-semibold text-sm">{card.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
