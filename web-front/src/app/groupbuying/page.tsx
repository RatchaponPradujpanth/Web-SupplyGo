'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useGroupBuying } from '@/hooks/useGroupBuying';
import GroupCard from '@/components/groupbuying/GroupCard';
import PaymentForm from '@/components/groupbuying/PaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function GroupBuyingPage() {
  const router = useRouter();
  const {
    points,
    groups,
    addresses,
    loading,
    error,
    nowTime,
    formatDuration,
    handleJoinGroup: joinGroup,
    handleLeaveGroup: leaveGroup,
    fetchData,
  } = useGroupBuying();

  const [modalGroupId, setModalGroupId] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(0);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].address_id);
    }
  }, [addresses, selectedAddressId]);

  const handleTopUp = () => {
    if (topUpAmount <= 0) {
      alert('กรุณาระบุจำนวน Point ที่ต้องการเติม');
      return;
    }
    setShowTopUpModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    alert(`เติม Point สำเร็จ! +${topUpAmount.toLocaleString()} Point 🎉`);
    setShowPaymentModal(false);
    setTopUpAmount(0);
    await fetchData();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setShowTopUpModal(true);
  };

  const handleOpenJoinModal = (groupId: number) => {
    if (addresses.length === 0) {
      alert('กรุณาเพิ่มที่อยู่จัดส่งก่อน');
      router.push('/profile?tab=addresses');
      return;
    }
    setModalGroupId(groupId);
  };

  const handleConfirmJoin = async () => {
    if (!modalGroupId || !selectedAddressId) {
      alert('กรุณาเลือกที่อยู่ก่อนเข้ากลุ่ม');
      return;
    }

    const group = groups.find(g => g.group_buying_id === modalGroupId);
    if (!group) return;

    if (points === null || points < group.points_per_member) {
      alert('คุณมี Point ไม่เพียงพอ');
      return;
    }

    try {
      await joinGroup(modalGroupId, selectedAddressId, group.points_per_member);
      alert('เข้ากลุ่มสำเร็จ 🎉');
      setModalGroupId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เข้ากลุ่มไม่สำเร็จ ❌';
      alert(errorMessage);
    }
  };

  const handleLeave = async (groupId: number) => {
    const confirmLeave = confirm('คุณต้องการออกจากกรุ๊ปนี้หรือไม่?');
    if (!confirmLeave) return;

    try {
      await leaveGroup(groupId);
      alert('ออกจากกลุ่มสำเร็จ ✅');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ออกจากกลุ่มไม่สำเร็จ ❌';
      alert(errorMessage);
    }
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
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              🎯 Group Buying
            </h1>
            <p className="text-gray-600 text-lg">ซื้อร่วมกันเพื่อรับส่วนลดพิเศษและสะสมแต้ม!</p>
          </div>

          <button 
            onClick={() => setShowTopUpModal(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg px-6 py-4 min-w-[180px] hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => {
            const expireTimestamp = group.expire_at ? new Date(group.expire_at).getTime() : Date.now();
            const remaining = Math.max(expireTimestamp - nowTime, 0);
            
            return (
              <GroupCard
                key={group.group_buying_id}
                group={group}
                timeRemaining={remaining}
                formatDuration={formatDuration}
                onJoin={() => handleOpenJoinModal(group.group_buying_id)}
                onLeave={() => handleLeave(group.group_buying_id)}
                userHasJoined={group.user_in_group}
              />
            );
          })}
        </div>
      </div>

      {/* Address Selection Modal */}
      {modalGroupId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">📍</span>
                เลือกที่อยู่จัดส่ง
              </h2>
              <p className="text-sm opacity-90 mt-2">กรุณาเลือกที่อยู่สำหรับจัดส่งสินค้า</p>
            </div>

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

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">💎</span>
                เติม Point
              </h2>
              <p className="text-sm opacity-90 mt-2">เติม Point เพื่อใช้ในการซื้อสินค้าแบบ Group Buying</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 text-center">
                <div className="text-sm text-gray-600 mb-1">Point ปัจจุบัน</div>
                <div className="text-3xl font-bold text-blue-600">
                  {points?.toLocaleString() ?? 0} Point
                </div>
              </div>

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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="text-3xl">💳</span>
                ชำระเงิน
              </h2>
              <p className="text-sm opacity-90 mt-2">
                กรุณากรอกข้อมูลบัตรเครดิต/เดบิตเพื่อชำระเงิน
              </p>
            </div>

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
