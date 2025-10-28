import { useState, useEffect } from 'react';
import { loadbalance } from '@/service/api/loadbalance';
import { loadgroupbuy } from '@/service/api/groupsharing/loadgroupbuy';
import { joingroup } from '@/service/api/groupsharing/joingroup';
import { leavegroup } from '@/service/api/groupsharing/leavegroup';
import { loadaddress } from '@/service/api/loadaddress';
import type { GroupBuyingResult, Address } from '@/types/type';

export function useGroupBuying() {
  const [groups, setGroups] = useState<GroupBuyingResult[]>([]);
  const [points, setPoints] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('ไม่พบ token');
      }

      const [balanceData, groupsData, addressData] = await Promise.all([
        loadbalance(token),
        loadgroupbuy(token),
        loadaddress(token),
      ]);

      setPoints(balanceData);
      setGroups(groupsData);
      setAddresses(addressData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: number, addressId: number, points: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('ไม่พบ token');

      await joingroup(groupId, points, addressId);
      await fetchData(); // Refresh data
      return { success: true };
    } catch (err) {
      console.error('Error joining group:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      };
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('ไม่พบ token');

      await leavegroup(groupId);
      await fetchData(); // Refresh data
      return { success: true };
    } catch (err) {
      console.error('Error leaving group:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด',
      };
    }
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return 'หมดเวลา';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(ss)}`;
  };

  const calculateTimeRemaining = (expireAt: string) => {
    const expireTime = new Date(expireAt).getTime();
    return expireTime - nowTime;
  };

  return {
    groups,
    points,
    addresses,
    loading,
    error,
    nowTime,
    fetchData,
    handleJoinGroup,
    handleLeaveGroup,
    formatDuration,
    calculateTimeRemaining,
  };
}
