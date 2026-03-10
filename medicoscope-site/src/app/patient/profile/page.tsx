"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProfilePage() {
  const { user, patientData } = useAuthStore();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Link href="/patient/profile/edit" className="px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium">Edit Profile</Link>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-2xl text-white">{user?.name?.charAt(0) || "P"}</div>
            <div><h2 className="text-xl font-bold">{user?.name}</h2><p className="text-gray-500">{user?.email}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {[{ label: "Phone", value: user?.phone || "N/A" }, { label: "Role", value: user?.role || "patient" }, { label: "Age", value: patientData?.age || "N/A" }, { label: "Gender", value: patientData?.gender || "N/A" }, { label: "Blood Group", value: patientData?.bloodGroup || "N/A" }, { label: "Patient ID", value: user?.id?.slice(-8) || "N/A" }].map(item => (
              <div key={item.label}><p className="text-sm text-gray-500">{item.label}</p><p className="font-medium capitalize">{String(item.value)}</p></div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
