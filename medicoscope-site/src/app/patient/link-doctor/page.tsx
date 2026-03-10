"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { authService } from "@/services/auth.service";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function LinkDoctorPage() {
  const [doctorCode, setDoctorCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorCode.trim()) { toast.error("Enter doctor code"); return; }
    setLoading(true);
    try {
      await authService.linkDoctor(doctorCode.trim());
      toast.success("Doctor linked successfully!");
      setDoctorCode("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to link doctor");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Link Doctor</h1>
          <p className="text-gray-500 mt-1">Enter your doctor&apos;s code to connect</p>
        </motion.div>
        <form onSubmit={handleLink} className="glass rounded-2xl p-6 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Doctor Code</label><input type="text" value={doctorCode} onChange={e => setDoctorCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none text-center font-mono text-lg tracking-wider" placeholder="Enter doctor code" /></div>
          <button type="submit" disabled={loading} className="w-full py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50">{loading ? "Linking..." : "Link Doctor"}</button>
        </form>
      </div>
    </DashboardLayout>
  );
}
