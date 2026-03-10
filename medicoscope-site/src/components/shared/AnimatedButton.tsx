"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit";
  loading?: boolean;
}

export function AnimatedButton({
  children,
  onClick,
  className,
  variant = "primary",
  size = "md",
  disabled = false,
  type = "button",
  loading = false,
}: AnimatedButtonProps) {
  const variants = {
    primary: "gradient-primary text-white shadow-lg shadow-orange-500/25",
    secondary: "bg-gray-200 dark:bg-gray-700 text-foreground",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-white",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/25",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading && (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
