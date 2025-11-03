'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  loadaddress, 
  addAddress, 
  updateAddress, 
  deleteAddress 
} from '@/service/apis';
import { 
  Home, Building2, Phone, MapPin, Plus, Edit2, Trash2, Save, X, Loader2, CheckCircle, XCircle,Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Address {
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

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const data = await loadaddress(token);
      setAddresses(data || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

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

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      if (editingAddress) {
        await updateAddress(token, editingAddress.address_id, addressForm);
        setMessage('success-อัปเดตที่อยู่สำเร็จ');
      } else {
        await addAddress(token, addressForm);
        setMessage('success-เพิ่มที่อยู่สำเร็จ');
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddressForm();
      loadAddresses();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(`error-${editingAddress ? 'อัปเดต' : 'เพิ่ม'}ที่อยู่ไม่สำเร็จ`);
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({ ...address });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('คุณต้องการลบที่อยู่นี้หรือไม่?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await deleteAddress(token, id);
      setMessage('success-ลบที่อยู่สำเร็จ');
      loadAddresses();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage('error-ลบที่อยู่ไม่สำเร็จ');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const isSuccess = message?.startsWith('success-');
  const messageText = message?.split('-')[1];

  return (
    <div>
      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
              isSuccess
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {isSuccess ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{messageText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">ที่อยู่ของฉัน</h3>
        <button
          onClick={() => { resetAddressForm(); setEditingAddress(null); setShowAddressForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={18} /> เพิ่มที่อยู่ใหม่
        </button>
      </div>

      {/* Address List */}
      <div className="space-y-3">
        {addresses.map(addr => (
          <div
            key={addr.address_id}
            className="p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-blue-300 hover:bg-gray-50 shadow-sm flex justify-between items-start"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{addr.firstname} {addr.lastname}</span>
                <span
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    addr.address_type === 'home' ? 'bg-green-100 text-green-700' :
                    addr.address_type === 'work' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {addr.address_type === 'home' && <><Home className="w-3.5 h-3.5" /> บ้าน</>}
                  {addr.address_type === 'work' && <><Building2 className="w-3.5 h-3.5" /> ที่ทำงาน</>}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" /> {addr.phone_number}
              </p>
              <p className="text-sm text-gray-700 flex items-start gap-1">
                <MapPin className="w-4 h-4 mt-[2px] shrink-0" />
                {addr.house_number} {addr.street} {addr.sub_district} {addr.district} {addr.province} {addr.postal_code}
              </p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleEditAddress(addr)} className="text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1 flex items-center gap-1">
                <Edit2 size={16} /> แก้ไข
              </button>
              <button onClick={() => handleDeleteAddress(addr.address_id)} className="text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 flex items-center gap-1">
                <Trash2 size={16} /> ลบ
              </button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-16 h-16 mx-auto mb-3 text-gray-300" />
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
            className="border-2 border-gray-200 rounded-xl p-6 mt-4 bg-gray-50 shadow-sm"
          >
            <h4 className="text-lg font-semibold mb-4">{editingAddress ? 'แก้ไขที่อยู่' : 'กรอกรายละเอียดที่อยู่'}</h4>

            <form onSubmit={handleAddressSubmit} className="space-y-4">
              {/* Grid: firstname / lastname */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ *</label>
                  <input
                    type="text"
                    value={addressForm.firstname}
                    onChange={(e) => setAddressForm({...addressForm, firstname: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล *</label>
                  <input
                    type="text"
                    value={addressForm.lastname}
                    onChange={(e) => setAddressForm({...addressForm, lastname: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ *</label>
                <input
                  type="tel"
                  value={addressForm.phone_number}
                  onChange={(e) => setAddressForm({...addressForm, phone_number: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* House / Street */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">บ้านเลขที่ *</label>
                  <input
                    type="text"
                    value={addressForm.house_number}
                    onChange={(e) => setAddressForm({...addressForm, house_number: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ถนน</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sub-district / District / Province */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล/แขวง *</label>
                  <input
                    type="text"
                    value={addressForm.sub_district}
                    onChange={(e) => setAddressForm({...addressForm, sub_district: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ/เขต *</label>
                  <input
                    type="text"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({...addressForm, district: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด *</label>
                  <input
                    type="text"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({...addressForm, province: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Postal code / Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์ *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทที่อยู่</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
  {['home', 'work', 'store'].map((type) => (
    <label
      key={type}
      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition
        ${addressForm.address_type === type ? 'border-blue-500 bg-blue-50 shadow' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
    >
      {type === 'home' && <Home className="w-5 h-5" />}
      {type === 'work' && <Building2 className="w-5 h-5" />}
      {type === 'store' && <Store className="w-5 h-5" />}
      <span className="capitalize">{type === 'home' ? 'บ้าน' : type === 'work' ? 'ที่ทำงาน' : 'ร้านค้า'}</span>
      <input
        type="radio"
        name="address_type"
        value={type}
        checked={addressForm.address_type === type}
        onChange={() => setAddressForm({ ...addressForm, address_type: type })}
        className="hidden"
      />
    </label>
  ))}
</div>

                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-6 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 text-gray-700 flex items-center gap-2"
                >
                  <X size={18} /> ยกเลิก
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
