"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { nearbyDoctorsService } from "@/services/nearby-doctors.service";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function NearbyDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [radius, setRadius] = useState(10);

  useEffect(() => { nearbyDoctorsService.getSpecializations().then(res => setSpecializations(Array.isArray(res) ? res : [])).catch(() => toast.error("Failed to load specializations")); }, []);

  const search = async () => {
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await nearbyDoctorsService.search({ lat: pos.coords.latitude, lng: pos.coords.longitude, radius, specialization: selectedSpec || undefined });
          const data = Array.isArray(res) ? res : [];
          setDoctors(data);
          if (!data.length) toast("No doctors found nearby");
        } catch { toast.error("Search failed"); }
        finally { setLoading(false); }
      }, () => { toast.error("Location access denied"); setLoading(false); });
    } catch { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Nearby Doctors</h1>
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Specialization</label><select value={selectedSpec} onChange={e => setSelectedSpec(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none"><option value="">All</option>{specializations.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Radius (km)</label><input type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none" /></div>
            <div className="flex items-end"><button onClick={search} disabled={loading} className="w-full py-2.5 gradient-primary text-white rounded-xl font-medium disabled:opacity-50">{loading ? "Searching..." : "🔍 Search"}</button></div>
          </div>
        </div>
        <div className="space-y-3">
          {doctors.map((doc, i) => (
            <motion.div key={doc._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div><p className="font-semibold">{doc.name}</p><p className="text-sm text-[#FF6B35]">{doc.specialization}</p><p className="text-sm text-gray-500 mt-1">📍 {doc.hospital || doc.address}</p>{doc.phone && <p className="text-sm text-gray-500">📞 {doc.phone}</p>}</div>
                {doc.distance && <span className="text-sm text-gray-500">{doc.distance.toFixed(1)} km</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
