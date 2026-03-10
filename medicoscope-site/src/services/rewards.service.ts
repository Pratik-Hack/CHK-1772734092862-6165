import { mainApi, chatbotApi } from './api';
import type { Reward, ClaimedReward } from '@/models';

export const rewardsService = {
  async getBalance(): Promise<Reward> {
    const res = await mainApi.get('/rewards');
    return res.data;
  },

  async syncCoins(totalCoins: number) {
    const res = await mainApi.put('/rewards', { totalCoins });
    return res.data;
  },

  async redeem(data: { userId: string; itemId: string; cost: number }) {
    const res = await chatbotApi.post('/rewards/redeem', data);
    return res.data;
  },

  async saveClaimedReward(data: Omit<ClaimedReward, 'id'>) {
    const res = await mainApi.post('/claimed-rewards', data);
    return res.data;
  },

  async getClaimedRewards(): Promise<ClaimedReward[]> {
    const res = await mainApi.get('/claimed-rewards');
    return res.data;
  },
};
