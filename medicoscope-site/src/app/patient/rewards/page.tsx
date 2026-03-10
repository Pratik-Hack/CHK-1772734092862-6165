"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCoinsStore } from "@/stores/coinsStore";
import { useAuthStore } from "@/stores/authStore";
import { rewardsService } from "@/services/rewards.service";
import { REWARD_ITEMS } from "@/lib/constants";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RewardsPage() {
  const { totalCoins, streak, sessions, deductCoins } = useCoinsStore();
  const { user } = useAuthStore();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const handleRedeem = async (item: typeof REWARD_ITEMS[number]) => {
    if (totalCoins < item.cost) { toast.error("Not enough coins"); return; }
    setRedeeming(item.id);
    try {
      deductCoins(item.cost);
      await rewardsService.redeem({ userId: user?.id || "", itemId: item.id, cost: item.cost });
      toast.success(`Redeemed: ${item.name}!`);
    } catch { toast.error("Failed to redeem"); }
    finally { setRedeeming(null); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><h1 className="text-2xl font-bold">Wellness Rewards</h1></motion.div>
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 text-center"><span className="text-3xl">⭐</span><p className="text-2xl font-bold mt-1">{totalCoins}</p><p className="text-sm text-gray-500">Total Coins</p></div>
          <div className="glass rounded-xl p-4 text-center"><span className="text-3xl">🔥</span><p className="text-2xl font-bold mt-1">{streak}</p><p className="text-sm text-gray-500">Day Streak</p></div>
          <div className="glass rounded-xl p-4 text-center"><span className="text-3xl">📊</span><p className="text-2xl font-bold mt-1">{sessions}</p><p className="text-sm text-gray-500">Sessions</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REWARD_ITEMS.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div><span className="text-3xl">{item.icon}</span><h3 className="text-lg font-semibold mt-2">{item.name}</h3><p className="text-sm text-gray-500 mt-1">{item.description}</p></div>
                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold">⭐ {item.cost}</span>
              </div>
              <button onClick={() => handleRedeem(item)} disabled={totalCoins < item.cost || redeeming === item.id} className="w-full mt-4 py-2.5 gradient-primary text-white rounded-xl font-medium disabled:opacity-50">
                {redeeming === item.id ? "Redeeming..." : totalCoins < item.cost ? "Not enough coins" : "Redeem"}
              </button>
            </motion.div>
          ))}
        </div>
        <Link href="/patient/rewards/claimed" className="block text-center text-[#FF6B35] font-medium hover:underline">View Claimed Rewards →</Link>
      </div>
    </DashboardLayout>
  );
}
