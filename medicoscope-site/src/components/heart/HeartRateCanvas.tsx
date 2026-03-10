"use client";

import { useRef, useEffect, useCallback } from "react";

interface HeartRateCanvasProps {
  data: { time: number; bpm: number }[];
  height?: number;
  speed?: number;
}

export function HeartRateCanvas({ data, height = 250, speed = 0.3 }: HeartRateCanvasProps) {
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

    // Background
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 30, bottom: 30, left: 10, right: 10 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Grid
    ctx.strokeStyle = "rgba(128,128,128,0.15)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    // Determine visible window
    const windowSize = Math.min(25, data.length);
    const start = Math.floor(offsetRef.current) % data.length;

    const bpms = data.map((d) => d.bpm);
    const minBpm = Math.min(...bpms) - 5;
    const maxBpm = Math.max(...bpms) + 5;
    const bpmRange = maxBpm - minBpm || 1;

    // Y-axis labels
    ctx.fillStyle = "rgba(128,128,128,0.6)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(minBpm + (bpmRange / 4) * (4 - i));
      const y = pad.top + (plotH / 4) * i;
      ctx.fillText(`${val}`, pad.left - 2, y + 3);
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    gradient.addColorStop(0, "rgba(255, 107, 53, 0.3)");
    gradient.addColorStop(1, "rgba(255, 107, 53, 0.02)");

    // Area fill
    ctx.beginPath();
    for (let i = 0; i < windowSize; i++) {
      const idx = (start + i) % data.length;
      const x = pad.left + (i / (windowSize - 1)) * plotW;
      const normalized = (data[idx].bpm - minBpm) / bpmRange;
      const y = pad.top + plotH - normalized * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const lastX = pad.left + plotW;
    ctx.lineTo(lastX, h - pad.bottom);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = "#FF6B35";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    for (let i = 0; i < windowSize; i++) {
      const idx = (start + i) % data.length;
      const x = pad.left + (i / (windowSize - 1)) * plotW;
      const normalized = (data[idx].bpm - minBpm) / bpmRange;
      const y = pad.top + plotH - normalized * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Leading dot
    const leadIdx = (start + windowSize - 1) % data.length;
    const leadNorm = (data[leadIdx].bpm - minBpm) / bpmRange;
    const lx = pad.left + plotW;
    const ly = pad.top + plotH - leadNorm * plotH;
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FF6B35";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,107,53,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current BPM overlay
    ctx.fillStyle = "#FF6B35";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(data[leadIdx].bpm)} BPM`, w - pad.right, pad.top - 8);

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
    <canvas ref={canvasRef} className="w-full block" style={{ height }} />
  );
}
