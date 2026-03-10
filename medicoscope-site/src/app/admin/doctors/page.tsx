"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminService } from "@/services/admin.service";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService
      .getDoctors()
      .then((res) => setDoctors(res.data || res.doctors || (Array.isArray(res) ? res : [])))
      .catch(() => toast.error("Failed to load doctors"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.email?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Doctors</h1>
          <span className="text-sm text-gray-500">{doctors.length} total</span>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or specialization..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none"
        />

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-4xl block mb-4">⚕️</span>
            <p>No doctors found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc, i) => (
              <motion.div
                key={doc._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {doc.name?.charAt(0) || "D"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Dr. {doc.name}</p>
                    <p className="text-sm text-[#FF6B35]">{doc.specialization || "General"}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {doc.email}
                      {doc.phone && ` · ${doc.phone}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {doc.hospital && (
                      <p className="text-xs text-gray-500">🏥 {doc.hospital}</p>
                    )}
                    {doc.yearsOfExperience && (
                      <p className="text-xs text-gray-400">{doc.yearsOfExperience} yrs exp</p>
                    )}
                    {doc.linkedPatientIds && (
                      <p className="text-xs text-gray-400 mt-1">{doc.linkedPatientIds.length} patients</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
