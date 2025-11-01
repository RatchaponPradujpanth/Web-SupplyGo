'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Tag,
  FileText,
} from 'lucide-react';

interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
}

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    category_name: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // โหลดข้อมูลประเภทสินค้า
  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:4000/api/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('โหลดประเภทสินค้าไม่สำเร็จ:', error);
      setMessage('error-ไม่สามารถโหลดประเภทสินค้าได้');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setCategoryForm({
      category_name: '',
      description: '',
    });
  };

  // เพิ่มหรืออัปเดตประเภทสินค้า
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (editingCategory) {
        // อัปเดตประเภทสินค้า
        const response = await fetch(
          `http://localhost:4000/api/categories/${editingCategory.category_id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(categoryForm),
          }
        );

        if (response.ok) {
          setMessage('success-อัปเดตประเภทสินค้าสำเร็จ');
          loadCategories();
        } else {
          throw new Error('อัปเดตไม่สำเร็จ');
        }
      } else {
        // เพิ่มประเภทสินค้าใหม่
        const response = await fetch('http://localhost:4000/api/createcategories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(categoryForm),
        });

        if (response.ok) {
          setMessage('success-เพิ่มประเภทสินค้าสำเร็จ');
          loadCategories();
        } else {
          throw new Error('เพิ่มไม่สำเร็จ');
        }
      }

      setShowForm(false);
      setEditingCategory(null);
      resetForm();
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage(`error-${editingCategory ? 'อัปเดต' : 'เพิ่ม'}ประเภทสินค้าไม่สำเร็จ`);
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // แก้ไขประเภทสินค้า
  const handleEdit = (category: Category) => {
    console.log('🔍 Editing category:', category); // Debug
    setEditingCategory(category);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description || '',
    });
    setShowForm(true);
  };

  // ลบประเภทสินค้า
  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบประเภทสินค้านี้หรือไม่?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:4000/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage('success-ลบประเภทสินค้าสำเร็จ');
        loadCategories();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('ลบไม่สำเร็จ');
      }
    } catch {
      setMessage('error-ลบประเภทสินค้าไม่สำเร็จ');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const isSuccess = message?.startsWith('success-');
  const messageText = message?.split('-')[1];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

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
            {isSuccess ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{messageText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">จัดการประเภทสินค้า</h3>
          <p className="text-sm text-gray-500 mt-1">
            เพิ่ม แก้ไข หรือลบประเภทสินค้าในระบบ
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCategory(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} /> เพิ่มประเภทใหม่
        </button>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {categories.map((category) => (
          <motion.div
            key={category.category_id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 border-2 rounded-xl hover:border-primary hover:shadow-lg transition-all duration-200 bg-white flex flex-col h-full min-h-[120px]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-gray-800">
                  {category.category_name}
                </h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-600 hover:bg-blue-50 rounded-lg p-1.5 transition"
                  title="แก้ไข"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(category.category_id)}
                  className="text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition"
                  title="ลบ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1">
              {category.description ? (
                <p className="text-sm text-gray-600 flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2 break-words">{category.description}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-400 flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="italic">ไม่มีคำอธิบาย</span>
                </p>
              )}
            </div>
          </motion.div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Tag className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p>ยังไม่มีประเภทสินค้า กรุณาเพิ่มประเภทใหม่</p>
          </div>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-2 border-primary/20 rounded-xl p-6 bg-blue-50/50 shadow-lg"
          >
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              {editingCategory ? 'แก้ไขประเภทสินค้า' : 'เพิ่มประเภทสินค้าใหม่'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ชื่อประเภท */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อประเภทสินค้า *
                </label>
                <input
                  type="text"
                  value={categoryForm.category_name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, category_name: e.target.value })
                  }
                  required
                  placeholder="เช่น เครื่องดื่ม, ขนม, อาหารแห้ง"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
              </div>

              {/* คำอธิบาย */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, description: e.target.value })
                  }
                  placeholder="อธิบายรายละเอียดของประเภทสินค้านี้..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  <span>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 text-gray-700 flex items-center gap-2 transition"
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
