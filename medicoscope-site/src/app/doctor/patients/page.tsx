"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { doctorService } from "@/services/doctor.service";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { doctorService.getPatients().then(res => setPatients(res.data || res.patients || (Array.isArray(res) ? res : []))).catch(() => toast.error("Failed to load patients")).finally(() => setLoading(false)); }, []);

  const filtered = patients.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Patients</h1>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none" />
        {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">👥</span><p>No patients found</p></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((patient, i) => (
              <motion.div key={patient._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/doctor/patients/${patient._id}`} className="block glass rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold">{patient.name?.charAt(0) || "P"}</div>
                    <div><p className="font-semibold">{patient.name}</p><p className="text-sm text-gray-500">{patient.email} · {patient.age ? `${patient.age} yrs` : ""} {patient.bloodGroup || ""}</p></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
