"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover = false,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700/50 shadow-lg p-6",
        hover && "cursor-pointer transition-shadow hover:shadow-xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
