"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth.service";
import { BLOOD_GROUPS } from "@/lib/constants";
import toast from "react-hot-toast";

function RegisterForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"patient" | "doctor">((searchParams.get("role") as "patient" | "doctor") || "patient");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "", age: "", gender: "male", bloodGroup: "A+", specialization: "", licenseNumber: "", hospital: "" });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const update = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name: formData.name, email: formData.email, password: formData.password, phone: formData.phone, role };
      if (role === "patient") { payload.age = Number(formData.age); payload.gender = formData.gender; payload.bloodGroup = formData.bloodGroup; }
      else { payload.specialization = formData.specialization; payload.licenseNumber = formData.licenseNumber; payload.hospital = formData.hospital; }
      const res = await authService.register(payload);
      setAuth(res.token, res.user);
      toast.success("Account created!");
      router.push(`/${res.user.role}/dashboard`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-gray-500 mt-1">Join MedicoScope</p>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">I am a...</p>
              <div className="grid grid-cols-2 gap-4">
                {(["patient", "doctor"] as const).map(r => (
                  <button key={r} onClick={() => setRole(r)} className={`p-4 rounded-xl border-2 transition-all ${role === r ? "border-[#FF6B35] bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 dark:border-gray-700"}`}>
                    <span className="text-3xl block mb-2">{r === "patient" ? "🏥" : "⚕️"}</span>
                    <span className="font-semibold capitalize">{r}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full py-3 gradient-primary text-white rounded-xl font-semibold">Next</button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-[#FF6B35] mb-2">&larr; Back</button>
              {[{ label: "Name", key: "name", type: "text" }, { label: "Email", key: "email", type: "email" }, { label: "Password", key: "password", type: "password" }, { label: "Phone", key: "phone", type: "tel" }].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <input type={f.type} value={(formData as Record<string, string>)[f.key]} onChange={e => update(f.key, e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none" />
                </div>
              ))}
              {role === "patient" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Age</label>
                      <input type="number" value={formData.age} onChange={e => update("age", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <select value={formData.gender} onChange={e => update("gender", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none">
                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Blood Group</label>
                    <select value={formData.bloodGroup} onChange={e => update("bloodGroup", e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none">
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {[{ label: "Specialization", key: "specialization" }, { label: "License Number", key: "licenseNumber" }, { label: "Hospital", key: "hospital" }].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium mb-1">{f.label}</label>
                      <input type="text" value={(formData as Record<string, string>)[f.key]} onChange={e => update(f.key, e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#FF6B35] outline-none" />
                    </div>
                  ))}
                </>
              )}
              <button type="submit" disabled={loading} className="w-full py-3 gradient-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50">
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-[#FF6B35] font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><RegisterForm /></Suspense>;
}
