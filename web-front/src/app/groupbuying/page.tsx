'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadbalance } from '@/service/api/loadbalance';
import { loadgroupbuy } from '@/service/api/groupsharing/loadgroupbuy';
import { joingroup } from '@/service/api/groupsharing/joingroup';
import { leavegroup } from '@/service/api/groupsharing/leavegroup';
import { loadaddress } from '@/service/api/loadaddress';
import type { GroupBuyingResult, Address } from '@/types/type';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Payment Form Component
function PaymentForm({ amount, onSuccess, onCancel }: { amount: number; onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setErrorMessage(error.message || 'การชำระเงินล้มเหลว');
        setProcessing(false);
        return;
      }

      // TODO: Send paymentMethod.id to backend to process payment
      // For now, simulate success
      console.log('Payment Method ID:', paymentMethod.id);
      console.log('Amount:', amount);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      onSuccess();
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการชำระเงิน');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ข้อมูลบัตร
        </label>
        <div className="p-4 border-2 border-gray-300 rounded-xl focus-within:border-orange-500 transition-colors">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Amount Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">จำนวนเงินที่ต้องชำระ:</span>
          <span className="text-2xl font-bold text-blue-600">
            ฿{(amount * 1).toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          * 1 Point = 1 บาท
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
            processing || !stripe
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {processing ? '⏳ กำลังดำเนินการ...' : '💳 ชำระเงิน'}
        </button>
      </div>
    </form>
  );
}

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

  const [nowTime, setNowTime] = useState(Date.now());
  const router = useRouter();

  // Countdown update
  useEffect(() => {
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    if (ms <= 0) return 'หมดเวลา';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(ss)}`;
  };

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
      console.log('🔍 Group data received:', groupData);
      console.log('🖼️ First group image:', groupData[0]?.product_image);
      console.log('💰 First group points_per_member:', groupData[0]?.points_per_member);
      console.log('📊 Full first group:', groupData[0]);
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
      
      // ✅ โหลด Point ใหม่จาก backend หลังเข้ากลุ่มสำเร็จ
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
      
      // ✅ โหลด Point ใหม่จาก backend หลังออกจากกลุ่มสำเร็จ
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

  const handleTopUp = () => {
    if (topUpAmount <= 0) {
      alert('กรุณาระบุจำนวน Point ที่ต้องการเติม');
      return;
    }

    // เปิด Payment Modal แทนการเติม Point โดยตรง
    setShowTopUpModal(false);
    setShowPaymentModal(true);
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
          <div className="text-6xl mb-4">❌</div>
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              🎯 Group Buying
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

        {/* Groups Grid */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => {
            const isJoining = joiningIds.includes(group.group_buying_id);
            const isLeaving = leavingIds.includes(group.group_buying_id);

            // Countdown
            const expireTimestamp = group.expire_at ? new Date(group.expire_at).getTime() : Date.now();
            const createdTimestamp = group.created_at ? new Date(group.created_at).getTime() : Date.now();
            const totalDuration = expireTimestamp - createdTimestamp;
            const remaining = Math.max(expireTimestamp - nowTime, 0);
            const timePercent = totalDuration > 0 ? Math.min(100, Math.round((remaining / totalDuration) * 100)) : 0;
            
            // Member progress
            const memberPercent = group.required_members > 0 
              ? Math.min(100, Math.round((group.member_count / group.required_members) * 100))
              : 0;
            
            const progressColor = timePercent <= 20 ? 'bg-red-500' : timePercent <= 50 ? 'bg-yellow-500' : 'bg-green-500';

            return (
              <div 
                key={group.group_buying_id} 
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Product Images */}
                <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200">
                    <img 
                      src={
                        group.product_image
                          ? (group.product_image.startsWith('http') 
                             ? group.product_image 
                             : `${process.env.NEXT_PUBLIC_API_URL}${group.product_image}`)
                          : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNzUgOTJIMTI1TTEwMCA2N1YxMTciIHN0cm9rZT0iIzk0QTNCOCIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4='
                      }
                      alt="Main product" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const imgElement = e.target as HTMLImageElement;
                        imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNzUgOTJIMTI1TTEwMCA2N1YxMTciIHN0cm9rZT0iIzk0QTNCOCIgc3Ryb2tlLXdpZHRoPSI4IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=';
                        imgElement.onerror = null; // ป้องกัน infinite loop
                      }}
                    />
                    {group.user_in_group && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                        <span>✓</span> เข้าร่วมแล้ว
                      </div>
                    )}
                    {group.is_full && !group.user_in_group && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        เต็มแล้ว
                      </div>
                    )}
                </div>

                <div className="p-6">
                  {/* Group Name & Description */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                      {group.group_name ?? '-'}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {group.description ?? 'ไม่มีคำอธิบาย'}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{group.member_count}</div>
                      <div className="text-xs text-gray-600 mt-1">สมาชิกปัจจุบัน</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">{group.required_members}</div>
                      <div className="text-xs text-gray-600 mt-1">เป้าหมาย</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center col-span-2">
                      <div className="text-2xl font-bold text-green-600">
                        {group.points_per_member ?? 0} Point
                      </div>
                      <div className="text-xs text-gray-600 mt-1">ราคาต่อคน</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <span className="text-lg">👥</span>
                        {group.member_count} / {group.required_members} คน
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <span className="text-lg">⏱️</span>
                        {formatDuration(remaining)}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-3 ${progressColor} transition-all duration-500 shadow-sm`} 
                        style={{ width: `${memberPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* User Status Banner */}
                  {group.user_in_group && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                        <span className="text-2xl">🎉</span>
                        <span>คุณอยู่ในกลุ่มนี้แล้ว</span>
                      </div>
                      <div className="text-sm text-green-600">
                        รอให้ครบ {group.required_members - group.member_count} คนอีกเพื่อสำเร็จ!
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mb-4">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      group.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : group.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-700'
                        : group.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {group.status === 'open' && '🟢 เปิดรับสมาชิก'}
                      {group.status === 'confirmed' && '✅ ยืนยันการสั่งซื้อแล้ว'}
                      {group.status === 'cancelled' && '❌ ยกเลิกแล้ว'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalGroupId(group.group_buying_id)}
                      disabled={
                        isJoining || 
                        group.status !== 'open' || 
                        group.is_full || 
                        group.user_in_group
                      }
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                        isJoining || group.status !== 'open' || group.is_full || group.user_in_group
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      }`}
                    >
                      {isJoining
                        ? '⏳ กำลังเข้ากลุ่ม...'
                        : group.status !== 'open'
                        ? group.status === 'confirmed'
                          ? '✅ กลุ่มถูกยืนยันแล้ว'
                          : '❌ กลุ่มถูกยกเลิก'
                        : group.is_full
                        ? '🚫 เต็มแล้ว'
                        : group.user_in_group
                        ? '✓ อยู่ในกลุ่มแล้ว'
                        : '🎯 เข้าร่วมกลุ่ม'}
                    </button>

                    {group.user_in_group && group.status === 'open' && (
                      <button
                        onClick={() => handleLeaveGroup(group.group_buying_id)}
                        disabled={isLeaving}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                          isLeaving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                        }`}
                      >
                        {isLeaving ? '⏳ กำลังออก...' : '🚪 ออก'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal เลือกที่อยู่ - ปรับปรุง UI */}
      {modalGroupId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">📍</span>
                เลือกที่อยู่จัดส่ง
              </h2>
              <p className="text-sm opacity-90 mt-2">กรุณาเลือกที่อยู่สำหรับจัดส่งสินค้า</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-600 mb-4">คุณยังไม่มีที่อยู่จัดส่ง</p>
                  <button
                    onClick={() => router.push('/profile?tab=addresses')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    เพิ่มที่อยู่ใหม่
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <label
                      key={addr.address_id}
                      className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedAddressId === addr.address_id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={addr.address_id}
                          checked={selectedAddressId === addr.address_id}
                          onChange={() => setSelectedAddressId(addr.address_id)}
                          className="mt-1 w-5 h-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-800">
                              {addr.firstname} {addr.lastname}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              addr.address_type === 'home' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {addr.address_type === 'home' ? '🏠 บ้าน' : '🏢 ที่ทำงาน'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            📞 {addr.phone_number}
                          </p>
                          <p className="text-sm text-gray-700">
                            📍 {addr.house_number} {addr.street} {addr.sub_district} {addr.district} {addr.province} {addr.postal_code}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {addresses.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setModalGroupId(null)}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmJoin}
                  disabled={!selectedAddressId}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedAddressId
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ✓ ยืนยันเข้ากลุ่ม
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal เติม Point */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">💎</span>
                เติม Point
              </h2>
              <p className="text-sm opacity-90 mt-2">เติม Point เพื่อใช้ในการซื้อสินค้าแบบ Group Buying</p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Current Balance */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 text-center">
                <div className="text-sm text-gray-600 mb-1">Point ปัจจุบัน</div>
                <div className="text-3xl font-bold text-blue-600">
                  {points?.toLocaleString() ?? 0} Point
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  เลือกจำนวน Point ที่ต้องการเติม
                </label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[100, 500, 1000, 2000, 5000, 10000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount)}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        topUpAmount === amount
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  หรือระบุจำนวนเอง
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={topUpAmount || ''}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    placeholder="ระบุจำนวน Point"
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    Point
                  </span>
                </div>
              </div>

              {/* Summary */}
              {topUpAmount > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Point ปัจจุบัน:</span>
                    <span className="font-semibold text-gray-800">{points?.toLocaleString() ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">จำนวนที่เติม:</span>
                    <span className="font-semibold text-green-600">+{topUpAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Point หลังเติม:</span>
                    <span className="text-xl font-bold text-green-600">
                      {((points ?? 0) + topUpAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setTopUpAmount(0);
                }}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleTopUp}
                disabled={topUpAmount <= 0}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                  topUpAmount > 0
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                ✓ ยืนยันเติม Point
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ชำระเงินผ่าน Stripe */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">💳</span>
                ชำระเงิน
              </h2>
              <p className="text-sm opacity-90 mt-2">
                กรุณากรอกข้อมูลบัตรเครดิต/เดบิตเพื่อชำระเงิน
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={topUpAmount}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}