'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getUserProfile, 
  loadaddress,
  addAddress,
  updateAddress,
  deleteAddress,
  UserProfile
} from '@/service/apis';

interface Address {
  address_id: number;
  firstname: string;
  lastname: string;
  phone_number: string;
  house_number: string;
  street: string;
  sub_district: string;
  district: string;
  province: string;
  postal_code: string;
  address_type: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    firstname: '',
    lastname: '',
    phone_number: '',
    house_number: '',
    street: '',
    sub_district: '',
    district: '',
    province: '',
    postal_code: '',
    address_type: 'home'
  });

  const router = useRouter();

  const loadProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const userProfile = await getUserProfile(token);
      setProfile(userProfile);

    } catch (error) {
      console.error('Error loading profile:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadAddresses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const addressData = await loadaddress(token);
      setAddresses(addressData || []); // แก้ไข: loadaddress return Address[] โดยตรง
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadAddresses();
  }, [loadProfile, loadAddresses]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (editingAddress) {
        await updateAddress(token, editingAddress.address_id, addressForm);
        setMessage('✅ อัปเดตที่อยู่สำเร็จ');
      } else {
        await addAddress(token, addressForm);
        setMessage('✅ เพิ่มที่อยู่สำเร็จ');
      }
      
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddressForm();
      loadAddresses();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(`❌ ${editingAddress ? 'อัปเดต' : 'เพิ่ม'}ที่อยู่ไม่สำเร็จ`);
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      firstname: '',
      lastname: '',
      phone_number: '',
      house_number: '',
      street: '',
      sub_district: '',
      district: '',
      province: '',
      postal_code: '',
      address_type: 'home'
    });
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      firstname: address.firstname,
      lastname: address.lastname,
      phone_number: address.phone_number,
      house_number: address.house_number,
      street: address.street,
      sub_district: address.sub_district,
      district: address.district,
      province: address.province,
      postal_code: address.postal_code,
      address_type: address.address_type
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('คุณต้องการลบที่อยู่นี้หรือไม่?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await deleteAddress(token, addressId);
      
      setMessage('✅ ลบที่อยู่สำเร็จ');
      loadAddresses();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('❌ ลบที่อยู่ไม่สำเร็จ');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
          <p className="text-gray-600 mt-2">จัดการข้อมูลส่วนตัวและที่อยู่ของคุณ</p>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 ข้อมูลส่วนตัว
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'addresses'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏠 ที่อยู่
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start space-x-8">
                  {/* Profile Icon - ไม่มีรูปโปรไฟล์ */}
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <span className="text-5xl text-white font-bold">
                        {profile?.username?.charAt(0).toUpperCase() || '�'}
                      </span>
                    </div>
                  </div>

                  {/* Profile Info - แสดงอย่างเดียว ไม่สามารถแก้ไขได้ */}
                  <div className="flex-1">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ชื่อผู้ใช้
                        </label>
                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profile?.username || '-'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          อีเมล
                        </label>
                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {profile?.email || '-'}
                        </div>
                      </div>

    
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'addresses' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">ที่อยู่ของฉัน</h3>
                  <button
                    onClick={() => {
                      resetAddressForm();
                      setEditingAddress(null);
                      setShowAddressForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    ➕ เพิ่มที่อยู่ใหม่
                  </button>
                </div>

                {/* Address List */}
                <div className="space-y-4 mb-8">
                  {addresses.map((address) => (
                    <div key={address.address_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {address.address_type === 'home' ? '🏠 บ้าน' : '🏢 ที่ทำงาน'}
                            </span>
                          </div>
                          <p className="font-medium">
                            {address.firstname} {address.lastname}
                          </p>
                          <p className="text-gray-600">📞 {address.phone_number}</p>
                          <p className="text-gray-600">
                            {address.house_number} {address.street} {address.sub_district} {address.district} {address.province} {address.postal_code}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.address_id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition"
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {addresses.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>ยังไม่มีที่อยู่ กรุณาเพิ่มที่อยู่ใหม่</p>
                    </div>
                  )}
                </div>

                {/* Address Form */}
                <AnimatePresence>
                  {showAddressForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                    >
                      <h4 className="text-lg font-semibold mb-4">
                        {editingAddress ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
                      </h4>
                      
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ชื่อ *
                            </label>
                            <input
                              type="text"
                              value={addressForm.firstname}
                              onChange={(e) => setAddressForm({...addressForm, firstname: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              นามสกุล *
                            </label>
                            <input
                              type="text"
                              value={addressForm.lastname}
                              onChange={(e) => setAddressForm({...addressForm, lastname: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            เบอร์โทรศัพท์ *
                          </label>
                          <input
                            type="tel"
                            value={addressForm.phone_number}
                            onChange={(e) => setAddressForm({...addressForm, phone_number: e.target.value})}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              บ้านเลขที่ *
                            </label>
                            <input
                              type="text"
                              value={addressForm.house_number}
                              onChange={(e) => setAddressForm({...addressForm, house_number: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ถนน
                            </label>
                            <input
                              type="text"
                              value={addressForm.street}
                              onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ตำบล/แขวง *
                            </label>
                            <input
                              type="text"
                              value={addressForm.sub_district}
                              onChange={(e) => setAddressForm({...addressForm, sub_district: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              อำเภอ/เขต *
                            </label>
                            <input
                              type="text"
                              value={addressForm.district}
                              onChange={(e) => setAddressForm({...addressForm, district: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              จังหวัด *
                            </label>
                            <input
                              type="text"
                              value={addressForm.province}
                              onChange={(e) => setAddressForm({...addressForm, province: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              รหัสไปรษณีย์ *
                            </label>
                            <input
                              type="text"
                              value={addressForm.postal_code}
                              onChange={(e) => setAddressForm({...addressForm, postal_code: e.target.value})}
                              required
                              pattern="[0-9]{5}"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ประเภทที่อยู่
                            </label>
                            <select
                              value={addressForm.address_type}
                              onChange={(e) => setAddressForm({...addressForm, address_type: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="home">🏠 บ้าน</option>
                              <option value="work">🏢 ที่ทำงาน</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex space-x-4 pt-4">
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {saving ? '💾 กำลังบันทึก...' : '💾 บันทึก'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                          >
                            ❌ ยกเลิก
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}