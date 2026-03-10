"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminService } from "@/services/admin.service";
import type { NearbyDoctor } from "@/models";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AdminNearbyDoctorsPage() {
  const [doctors, setDoctors] = useState<NearbyDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService
      .getNearbyDoctors()
      .then((res) => setDoctors(Array.isArray(res) ? res : []))
      .catch(() => toast.error("Failed to load nearby doctors"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      d.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Nearby Doctors</h1>
          <Link
            href="/admin/nearby-doctors/add"
            className="px-4 py-2 gradient-primary text-white rounded-xl font-medium text-sm hover:shadow-lg transition-shadow"
          >
            + Add Doctor
          </Link>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, specialization, or address..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none"
        />

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-4xl block mb-4">📍</span>
            <p>No nearby doctors found</p>
            <Link href="/admin/nearby-doctors/add" className="text-[#FF6B35] font-medium mt-2 inline-block">
              Add one now →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc, i) => (
              <motion.div
                key={doc.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{doc.name}</p>
                    <p className="text-sm text-[#FF6B35]">{doc.specialization}</p>
                    <p className="text-sm text-gray-500 mt-1">📍 {doc.address}</p>
                    {doc.phone && <p className="text-sm text-gray-500">📞 {doc.phone}</p>}
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Lat: {doc.latitude}</p>
                    <p>Lng: {doc.longitude}</p>
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
