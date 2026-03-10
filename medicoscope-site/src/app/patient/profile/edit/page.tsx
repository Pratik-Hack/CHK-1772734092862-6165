"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const { user, patientData, setAuth } = useAuthStore();
  const [formData, setFormData] = useState({ name: user?.name || "", phone: user?.phone || "", age: String(patientData?.age || ""), gender: patientData?.gender || "male" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.updateProfile({ ...formData, age: Number(formData.age) });
      if (res.token && res.user) setAuth(res.token, res.user);
      toast.success("Profile updated");
      router.push("/patient/profile");
    } catch { toast.error("Update failed"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
            {[{ label: "Name", key: "name", type: "text" }, { label: "Phone", key: "phone", type: "tel" }, { label: "Age", key: "age", type: "number" }].map(f => (
              <div key={f.key}><label className="block text-sm font-medium mb-1">{f.label}</label><input type={f.type} value={(formData as Record<string, string>)[f.key]} onChange={e => update(f.key, e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none" /></div>
            ))}
            <div><label className="block text-sm font-medium mb-1">Gender</label><select value={formData.gender} onChange={e => update("gender", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.back()} className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-medium">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50">{loading ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
