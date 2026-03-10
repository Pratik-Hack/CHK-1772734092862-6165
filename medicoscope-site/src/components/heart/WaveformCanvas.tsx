"use client";

import { useRef, useEffect, useCallback } from "react";

interface WaveformCanvasProps {
  data: number[];
  color?: string;
  backgroundColor?: string;
  height?: number;
  speed?: number;
  lineWidth?: number;
  label?: string;
}

export function WaveformCanvas({
  data,
  color = "#10b981",
  backgroundColor = "transparent",
  height = 150,
  speed = 2,
  lineWidth = 1.5,
  label,
}: WaveformCanvasProps) {
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
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // Draw waveform
    const windowSize = Math.min(500, data.length);
    const start = Math.floor(offsetRef.current) % data.length;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";

    for (let i = 0; i < windowSize; i++) {
      const idx = (start + i) % data.length;
      const x = (i / windowSize) * w;
      const normalized = (data[idx] - min) / range;
      const y = h - normalized * (h - 20) - 10;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    offsetRef.current += speed;
    if (offsetRef.current >= data.length) offsetRef.current = 0;

    rafRef.current = requestAnimationFrame(draw);
  }, [data, color, backgroundColor, speed, lineWidth]);

  useEffect(() => {
    if (data.length > 0) {
      offsetRef.current = 0;
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, draw]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height }}>
      {label && (
        <span className="absolute top-2 left-3 text-xs font-medium opacity-60 z-10">{label}</span>
      )}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
