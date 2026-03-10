"use client";

import { useRef, useEffect, useCallback } from "react";

interface ECGCanvasProps {
  data: number[];
  height?: number;
  speed?: number;
}

export function ECGCanvas({ data, height = 200, speed = 1 }: ECGCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    // Grid lines (subtle green)
    ctx.strokeStyle = "rgba(0, 255, 0, 0.08)";
    ctx.lineWidth = 0.5;
    const gridSpacing = 20;
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw ECG line
    const windowSize = Math.min(250, data.length);
    const start = Math.floor(offsetRef.current) % data.length;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Glow effect
    ctx.shadowColor = "#00FF00";
    ctx.shadowBlur = 4;

    ctx.beginPath();
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    for (let i = 0; i < windowSize; i++) {
      const idx = (start + i) % data.length;
      const x = (i / windowSize) * w;
      const normalized = (data[idx] - min) / range;
      const y = h - normalized * (h - 30) - 15;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Scan line effect (bright dot at the leading edge)
    const leadX = w;
    const leadIdx = (start + windowSize - 1) % data.length;
    const leadNorm = (data[leadIdx] - min) / range;
    const leadY = h - leadNorm * (h - 30) - 15;
    ctx.beginPath();
    ctx.arc(leadX, leadY, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#00FF00";
    ctx.fill();

    offsetRef.current += speed;
    if (offsetRef.current >= data.length) offsetRef.current = 0;

    rafRef.current = requestAnimationFrame(draw);
  }, [data, speed]);

  useEffect(() => {
    if (data.length > 0) {
      offsetRef.current = 0;
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, draw]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-gray-800" style={{ height }}>
      <span className="absolute top-2 left-3 text-[10px] font-mono text-green-500/60 z-10">ECG</span>
      <span className="absolute top-2 right-3 text-[10px] font-mono text-green-500/60 z-10">25mm/s</span>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
