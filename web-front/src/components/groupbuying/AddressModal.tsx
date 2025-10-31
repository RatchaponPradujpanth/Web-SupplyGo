'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Package, Phone, Home, Building2, Store, Check } from 'lucide-react';
import type { Address } from '@/types/type';

type Props = {
  addresses: Address[];
  selectedAddressId: number | null;
  setSelectedAddressId: (id: number) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AddressModal({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  onClose,
  onConfirm,
}: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <MapPin className="w-7 h-7" />
            เลือกที่อยู่จัดส่ง
          </h2>
          <p className="text-sm opacity-90 mt-2">กรุณาเลือกที่อยู่สำหรับจัดส่งสินค้า</p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
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
              {addresses.map((addr) => (
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
                        <span
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            addr.address_type === 'home'
                              ? 'bg-green-100 text-green-700'
                              : addr.address_type === 'work'
                              ? 'bg-blue-100 text-blue-700'
                              : addr.address_type === 'store'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {addr.address_type === 'home' && (
                            <>
                              <Home className="w-3.5 h-3.5" /> บ้าน
                            </>
                          )}
                          {addr.address_type === 'work' && (
                            <>
                              <Building2 className="w-3.5 h-3.5" /> ที่ทำงาน
                            </>
                          )}
                          {addr.address_type === 'store' && (
                            <>
                              <Store className="w-3.5 h-3.5" /> ร้านค้า
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <Phone className="w-4 h-4" /> {addr.phone_number}
                      </p>
                      <p className="text-sm text-gray-700 flex items-start gap-1">
                        <MapPin className="w-4 h-4 mt-[2px] shrink-0" />
                        {addr.house_number} {addr.street} {addr.sub_district}{' '}
                        {addr.district} {addr.province} {addr.postal_code}
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
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-all"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedAddressId}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedAddressId
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedAddressId ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> ยืนยันเข้ากลุ่ม
                </span>
              ) : (
                '✓ ยืนยันเข้ากลุ่ม'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
