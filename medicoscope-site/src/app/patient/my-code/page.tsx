"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function MyCodePage() {
  const { user } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !user?.id) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 200;
    canvas.width = size; canvas.height = size;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    const code = user.id;
    const cellSize = size / 10;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if (code.charCodeAt((i * 10 + j) % code.length) % 2 === 0) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">My Patient Code</h1>
          <p className="text-gray-500 mt-1">Share this code with your doctor</p>
        </motion.div>
        <div className="glass rounded-2xl p-8 space-y-4">
          <canvas ref={canvasRef} className="mx-auto rounded-xl border border-gray-200 dark:border-gray-700" />
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
            <p className="text-sm text-gray-500">Patient ID</p>
            <p className="font-mono font-bold text-lg">{user?.id || "N/A"}</p>
          </div>
          <p className="text-sm text-gray-500">Show this code to your doctor to link your account</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
