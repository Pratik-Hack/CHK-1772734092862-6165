"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SidebarItem { label: string; href: string; icon: string; }

const patientLinks: SidebarItem[] = [
  { label: "Dashboard", href: "/patient/dashboard", icon: "🏠" },
  { label: "Profile", href: "/patient/profile", icon: "👤" },
  { label: "My Code", href: "/patient/my-code", icon: "📱" },
  { label: "Link Doctor", href: "/patient/link-doctor", icon: "🔗" },
  { label: "Rewards", href: "/patient/rewards", icon: "⭐" },
  { label: "Chat History", href: "/patient/chat/history", icon: "💬" },
  { label: "MindSpace History", href: "/patient/mindspace/history", icon: "🧠" },
];

const doctorLinks: SidebarItem[] = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: "🏠" },
  { label: "My Patients", href: "/doctor/patients", icon: "👥" },
  { label: "Diagnostics", href: "/doctor/diagnostics", icon: "🔬" },
  { label: "Reports", href: "/doctor/reports", icon: "📊" },
  { label: "Notifications", href: "/doctor/notifications", icon: "🔔" },
];

const adminLinks: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "🏠" },
  { label: "Patients", href: "/admin/patients", icon: "👥" },
  { label: "Doctors", href: "/admin/doctors", icon: "⚕️" },
  { label: "Nearby Doctors", href: "/admin/nearby-doctors", icon: "📍" },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const links = user?.role === "doctor" ? doctorLinks : user?.role === "admin" ? adminLinks : patientLinks;

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 p-4">
      <div className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <motion.div whileHover={{ x: 4 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive ? "gradient-primary text-white shadow-lg shadow-orange-500/20" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span>{link.icon}</span>
                {link.label}
              </motion.div>
            </Link>
          );
        })}
      </div>
      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-4">
        🚪 Logout
      </button>
    </aside>
  );
}
