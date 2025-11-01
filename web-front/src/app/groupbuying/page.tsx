'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadbalance } from '@/service/api/loadbalance';
import { loadgroupbuy } from '@/service/api/groupsharing/loadgroupbuy';
import { joingroup } from '@/service/api/groupsharing/joingroup';
import { leavegroup } from '@/service/api/groupsharing/leavegroup';
import { loadaddress } from '@/service/api/loadaddress';
import type { GroupBuyingResult, Address } from '@/types/type';
import TopupFormModal from '@/components/customer/topupFrom';
import AddressModal from '@/components/groupbuying/AddressModal';
import TopUpAmountModal from '@/components/groupbuying/TopUpAmountModal';
import GroupBuyingCard from '@/components/groupbuying/groupbuyingCard';
import { 
  Target, Sparkles, CircleDot, Lock, User, 
  Search, Package, UserX, Inbox, XCircle 
} from 'lucide-react';

type FilterTab = 'all' | 'open' | 'closed' | 'my-groups';

export default function GroupBuyingPage() {
  const [points, setPoints] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupBuyingResult[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningIds, setJoiningIds] = useState<number[]>([]);
  const [leavingIds, setLeavingIds] = useState<number[]>([]);
  const [modalGroupId, setModalGroupId] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const [nowTime, setNowTime] = useState(Date.now());
  const router = useRouter();

  // Countdown update
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
        router.push('/');
        return;
      }

      const balanceData = await loadbalance(token);
      setPoints(balanceData);

      const groupData = await loadgroupbuy(token);
      if (Array.isArray(groupData)) {
        setGroups(groupData);
      }

      const addressData = await loadaddress(token);
      setAddresses(Array.isArray(addressData) ? addressData : []);
      if (addressData.length > 0) setSelectedAddressId(addressData[0].address_id);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmJoin = async () => {
    if (!modalGroupId || !selectedAddressId) {
      alert('กรุณาเลือกที่อยู่ก่อนเข้ากลุ่ม');
      return;
    }

    if (points === null) return;

    const group = groups.find(g => g.group_buying_id === modalGroupId);
    if (!group) return;

    if (points < group.points_per_member) {
      alert('คุณมี point ไม่เพียงพอ');
      return;
    }

    // Optimistic update
    setGroups(prev =>
      prev.map(g =>
        g.group_buying_id === modalGroupId
          ? { ...g, user_in_group: true, member_count: g.member_count + 1 }
          : g
      )
    );
    setJoiningIds(prev => [...prev, modalGroupId]);

    try {
      await joingroup(modalGroupId, points, selectedAddressId);
      
      // โหลด Point ใหม่จาก backend หลังเข้ากลุ่มสำเร็จ
      const token = localStorage.getItem('token');
      if (token) {
        const updatedBalance = await loadbalance(token);
        setPoints(updatedBalance);
      }
      
      alert('เข้ากลุ่มสำเร็จ 🎉');
      setModalGroupId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เข้ากลุ่มไม่สำเร็จ ❌';
      alert(errorMessage);
      // Revert optimistic update
      setGroups(prev =>
        prev.map(g =>
          g.group_buying_id === modalGroupId
            ? { ...g, user_in_group: false, member_count: g.member_count - 1 }
            : g
        )
      );
    } finally {
      setJoiningIds(prev => prev.filter(id => id !== modalGroupId));
    }
  };

  const handleLeaveGroup = async (group_buying_id: number) => {
    const confirmLeave = confirm('คุณต้องการออกจากกรุ๊ปนี้หรือไม่?');
    if (!confirmLeave) return;

    const group = groups.find(g => g.group_buying_id === group_buying_id);
    if (!group) return;

    // Optimistic update
    setGroups(prev =>
      prev.map(g =>
        g.group_buying_id === group_buying_id
          ? { ...g, user_in_group: false, member_count: Math.max(g.member_count - 1, 0) }
          : g
      )
    );
    setLeavingIds(prev => [...prev, group_buying_id]);

    try {
      await leavegroup(group_buying_id);
      
      // โหลด Point ใหม่จาก backend หลังออกจากกลุ่มสำเร็จ
      const token = localStorage.getItem('token');
      if (token) {
        const updatedBalance = await loadbalance(token);
        setPoints(updatedBalance);
      }
      
      alert('ออกจากกลุ่มสำเร็จ ✅');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ออกจากกลุ่มไม่สำเร็จ ❌';
      alert(errorMessage);
      // Revert optimistic update
      setGroups(prev =>
        prev.map(g =>
          g.group_buying_id === group_buying_id
            ? { ...g, user_in_group: true, member_count: g.member_count + 1 }
            : g
        )
      );
    } finally {
      setLeavingIds(prev => prev.filter(id => id !== group_buying_id));
    }
  };

  const handlePaymentSuccess = () => {
    // เมื่อชำระเงินสำเร็จ ให้เพิ่ม Point
    setPoints(prev => (prev ?? 0) + topUpAmount);
    alert(`เติม Point สำเร็จ! +${topUpAmount.toLocaleString()} Point 🎉`);
    setShowPaymentModal(false);
    setTopUpAmount(0);
    fetchData(); // Reload data
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setShowTopUpModal(true); // กลับไปหน้าเลือกจำนวน
  };

  // Filter groups based on active tab
  const filteredGroups = groups.filter(group => {
    switch (activeTab) {
      case 'open':
        return group.status === 'open';
      case 'closed':
        return group.status === 'confirmed' || group.status === 'cancelled';
      case 'my-groups':
        return group.user_in_group;
      default:
        return true; // 'all'
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-3">
              <Target className="w-10 h-10 text-blue-600" />
              Group Buying
            </h1>
            <p className="text-gray-600 text-lg">ซื้อร่วมกันเพื่อรับส่วนลดพิเศษและสะสมแต้ม!</p>
          </div>

          {/* Balance Display - มุมขวาบน */}
          <button 
            onClick={() => setShowTopUpModal(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg px-6 py-4 min-w-[180px] hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
          >
            <div className="text-center text-white">
              <div className="text-xs opacity-90 mb-1">Point ของคุณ</div>
              {points != null && (
                <div className="text-3xl font-bold tracking-tight">
                  {points.toLocaleString()}
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-5 h-5" /> ทั้งหมด
              <span className="ml-2 text-sm opacity-80">({groups.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'open'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CircleDot className="w-5 h-5" /> เปิดรับ
              <span className="ml-2 text-sm opacity-80">
                ({groups.filter(g => g.status === 'open').length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'closed'
                  ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Lock className="w-5 h-5" /> ปิดแล้ว
              <span className="ml-2 text-sm opacity-80">
                ({groups.filter(g => g.status === 'confirmed' || g.status === 'cancelled').length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'my-groups'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5" /> กรุ๊ปของฉัน
              <span className="ml-2 text-sm opacity-80">
                ({groups.filter(g => g.user_in_group).length})
              </span>
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map(group => {
            const isJoining = joiningIds.includes(group.group_buying_id);
            const isLeaving = leavingIds.includes(group.group_buying_id);

            return (
              <GroupBuyingCard
                key={group.group_buying_id}
                group={group}
                nowTime={nowTime}
                isJoining={isJoining}
                isLeaving={isLeaving}
                onJoinClick={(id) => setModalGroupId(id)}
                onLeaveClick={handleLeaveGroup}
              />
            );
          })}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4 flex justify-center">
              {activeTab === 'open' && <Search className="w-16 h-16 text-gray-400" />}
              {activeTab === 'closed' && <Package className="w-16 h-16 text-gray-400" />}
              {activeTab === 'my-groups' && <UserX className="w-16 h-16 text-gray-400" />}
              {activeTab === 'all' && <Inbox className="w-16 h-16 text-gray-400" />}
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {activeTab === 'open' && 'ยังไม่มีกรุ๊ปที่เปิดรับสมาชิก'}
              {activeTab === 'closed' && 'ยังไม่มีกรุ๊ปที่ปิดแล้ว'}
              {activeTab === 'my-groups' && 'คุณยังไม่ได้เข้าร่วมกรุ๊ปใดๆ'}
              {activeTab === 'all' && 'ยังไม่มีกรุ๊ปในระบบ'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'my-groups' 
                ? 'เข้าร่วมกรุ๊ปเพื่อรับส่วนลดพิเศษ!' 
                : 'กรุณารอสักครู่หรือลองอัปเดตหน้าใหม่'}
            </p>
          </div>
        )}
      </div>

      {/* Address selection modal */}
      {modalGroupId && (
        <AddressModal
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          setSelectedAddressId={(id) => setSelectedAddressId(id)}
          onClose={() => setModalGroupId(null)}
          onConfirm={handleConfirmJoin}
        />
      )}

      {/* Top-up amount modal */}
      {showTopUpModal && (
        <TopUpAmountModal
          amount={topUpAmount}
          setAmount={(n) => setTopUpAmount(n)}
          onCancel={() => { setShowTopUpModal(false); setTopUpAmount(0); }}
          onProceed={() => { setShowTopUpModal(false); setShowPaymentModal(true); }}
        />
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <TopupFormModal
          amount={topUpAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}