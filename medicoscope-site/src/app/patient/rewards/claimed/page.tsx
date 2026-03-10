"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { rewardsService } from "@/services/rewards.service";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

export default function ClaimedRewardsPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { rewardsService.getClaimedRewards().then(res => setRewards(Array.isArray(res) ? res : [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Claimed Rewards</h1>
        {loading ? <div className="text-center py-20 text-gray-400">Loading...</div> : rewards.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><span className="text-4xl block mb-4">🎁</span><p>No rewards claimed yet</p></div>
        ) : (
          <div className="space-y-3">
            {rewards.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 flex items-center justify-between">
                <div><p className="font-medium">{r.itemName || r.title || r.itemId}</p><p className="text-sm text-gray-500">{formatDate(r.claimedAt || r.createdAt)}</p></div>
                <span className="text-sm text-amber-600">-{r.cost || r.coinsCost} ⭐</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
