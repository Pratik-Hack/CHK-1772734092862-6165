"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🧠",
    title: "AI-Powered Diagnosis",
    description:
      "Advanced machine learning models detect skin conditions, analyze chest X-rays, and evaluate brain MRIs with high accuracy.",
  },
  {
    icon: "📸",
    title: "Capture or Upload",
    description:
      "Use your camera or upload existing medical images for instant AI-powered analysis and detailed reports.",
  },
  {
    icon: "🫀",
    title: "Heart & Vitals Monitoring",
    description:
      "Record heart sounds for cardiac analysis, monitor real-time vitals including heart rate, blood pressure, and SpO2.",
  },
  {
    icon: "🧘",
    title: "MindSpace Mental Health",
    description:
      "30-second voice check-ins for mental health analysis with emotional insights and wellness recommendations.",
  },
  {
    icon: "🤖",
    title: "AI Medical Assistant",
    description:
      "Chat with our intelligent medical assistant for health queries, first aid guidance, and personalized advice.",
  },
  {
    icon: "🏆",
    title: "Wellness Rewards",
    description:
      "Earn coins for healthy habits and redeem them for yoga guides, nutrition plans, and wellness content.",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Animated Heart Logo */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary shadow-2xl shadow-orange-500/30 mb-8"
            >
              <svg
                className="w-14 h-14 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF4500] to-[#FF8C61] bg-clip-text text-transparent">
                MedicoScope
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
              AI-Powered Healthcare at Your Fingertips. Diagnostics, monitoring,
              and wellness — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register?role=patient"
                className="w-full sm:w-auto px-8 py-4 gradient-primary text-white rounded-2xl text-lg font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
              >
                Get Started as Patient
              </Link>
              <Link
                href="/register?role=doctor"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#2a2a2a] border-2 border-[#FF6B35] text-[#FF6B35] rounded-2xl text-lg font-semibold hover:bg-[#FF6B35] hover:text-white transition-all"
              >
                Get Started as Doctor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-[#1e1e1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for{" "}
              <span className="text-[#FF6B35]">Better Health</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive healthcare tools powered by cutting-edge AI
              technology, designed for patients and doctors alike.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-gray-800 hover:border-[#FF6B35]/30 hover:shadow-lg transition-all group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-[#FF6B35] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "3+", label: "AI Models" },
              { value: "7", label: "Languages" },
              { value: "24/7", label: "Monitoring" },
              { value: "3D", label: "Visualization" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center text-white"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg">
            Join MedicoScope today and experience the future of healthcare
            powered by artificial intelligence.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 gradient-primary text-white rounded-2xl text-lg font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
