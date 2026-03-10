"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { adminService } from "@/services/admin.service";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AddNearbyDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    phone: "",
    address: "",
    latitude: "",
    longitude: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.specialization || !form.phone || !form.address || !form.latitude || !form.longitude) {
      toast.error("Please fill in all fields");
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Latitude and longitude must be valid numbers");
      return;
    }

    setLoading(true);
    try {
      await adminService.addNearbyDoctor({
        name: form.name,
        specialization: form.specialization,
        phone: form.phone,
        address: form.address,
        latitude: lat,
        longitude: lng,
      });
      toast.success("Doctor added successfully!");
      router.push("/admin/nearby-doctors");
    } catch {
      toast.error("Failed to add doctor");
    } finally {
      setLoading(false);
    }
  };

  const fillCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success("Location captured!");
      },
      () => toast.error("Location access denied")
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Add Nearby Doctor</h1>
          <p className="text-gray-500 mt-1">Register a new doctor location for patient discovery</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Doctor Name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Dr. John Doe"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Specialization</label>
            <input
              value={form.specialization}
              onChange={(e) => update("specialization", e.target.value)}
              placeholder="Cardiologist, Dermatologist, etc."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Clinic address"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                placeholder="18.1234"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                placeholder="75.1234"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={fillCurrentLocation}
            className="w-full py-2.5 rounded-xl border border-[#FF6B35] text-[#FF6B35] font-medium hover:bg-[#FF6B35]/10 transition-colors"
          >
            📍 Use Current Location
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 gradient-primary text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Doctor"}
          </button>
        </motion.form>
      </div>
    </DashboardLayout>
  );
}
