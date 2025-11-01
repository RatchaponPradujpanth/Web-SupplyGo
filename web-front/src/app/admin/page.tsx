"use client";

import { useEffect, useState } from "react";
import { admindashboard } from "@/service/api/adminDashboard";
import { paymentHistory } from "@/service/api/groupsharing/admin/paymenthistory";
import { allOrderHistory } from "@/service/api/groupsharing/admin/allorderhistory";
import { getPendingWithdrawals } from "@/service/api/groupsharing/admin/getPendingWithdrawals";
import type {
  AdminDashboardApiResponse,
  PaymentHistoryOrder,
  AdminOrderHistoryOrder,
} from "@/types/type";

// Import Components
import DashboardStats from "@/components/admin/DashboardStats";
import RecentOrders from "@/components/admin/RecentOrders";
import UsersTable from "@/components/admin/UsersTable";
import ProductsTable from "@/components/admin/ProductsTable";
import CategoriesManager from "@/components/admin/CategoriesManager";
import OrdersList from "@/components/admin/OrdersList";
import PaymentsTable from "@/components/admin/PaymentsTable";
import WithdrawalList from "@/components/admin/WithdrawalList";
import PaymentModal from "@/components/admin/PaymentModalProps ";
// Import Lucide Icons
import { 
  Settings, BarChart2, Users, Box, ShoppingCart, CreditCard, Banknote, Tag 
} from "lucide-react";

interface Withdrawal {
  store_withdrawals_id: number;
  shop_id: number;
  points: number;
  status: string;
  requested_at: string;
  store: {
    shop_name: string;
    stripe_account_id: string;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardApiResponse | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentHistoryOrder[]>([]);
  const [ordersData, setOrdersData] = useState<AdminOrderHistoryOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<
    "dashboard" | "users" | "products" | "categories" | "orders" | "payments" | "withdraw"
  >("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentWithdrawal, setCurrentWithdrawal] = useState<Withdrawal | null>(null);
  
  // State สำหรับ collapsible menu
  const [managementOpen, setManagementOpen] = useState(true);
  const [financialOpen, setFinancialOpen] = useState(true);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("ไม่พบโทเค็น");
          setLoading(false);
          return;
        }
        const res = await admindashboard(token);
        setData(res);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลหน้าหลักได้");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Fetch payment history
  useEffect(() => {
    if (activeSidebar === "payments") {
      const fetchPayments = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("ไม่พบโทเค็น");
          const res = await paymentHistory(token);
          setPaymentData(res);
        } catch {
          setError("ไม่สามารถโหลดประวัติการชำระเงินได้");
        } finally {
          setLoading(false);
        }
      };
      fetchPayments();
    }
  }, [activeSidebar]);

  // Fetch orders
  useEffect(() => {
    if (activeSidebar === "orders") {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("ไม่พบโทเค็น");
          const res = await allOrderHistory(token);
          setOrdersData(res);
        } catch {
          setError("ไม่สามารถโหลดคำสั่งซื้อได้");
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeSidebar]);

  // Fetch withdrawals
  useEffect(() => {
    if (activeSidebar === "withdraw") {
      const fetchWithdrawals = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("ไม่พบโทเค็น");
          const res = await getPendingWithdrawals(token);
          setWithdrawals(res.withdrawals || []);
        } catch {
          setError("ไม่สามารถโหลดคำขอถอนเงินได้");
        } finally {
          setLoading(false);
        }
      };
      fetchWithdrawals();
    }
  }, [activeSidebar]);

  const openModal = (w: Withdrawal) => {
    setCurrentWithdrawal(w);
    setModalOpen(true);
  };

  const closeModal = () => {
    setCurrentWithdrawal(null);
    setModalOpen(false);
  };

  const handlePaymentSuccess = () => {
    if (currentWithdrawal) {
      setWithdrawals((prev) =>
        prev.filter((w) => w.store_withdrawals_id !== currentWithdrawal.store_withdrawals_id)
      );
    }
    closeModal();
    alert("จ่ายเงินและอนุมัติเรียบร้อยแล้ว ✅");
  };

  if (loading) return <div className="p-6 text-center text-gray-600">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="p-6 text-red-500">เกิดข้อผิดพลาด: {error}</div>;
  if (!data) return <div className="p-6 text-gray-600">ไม่มีข้อมูล</div>;

  const { dashboard } = data;

  const getSectionBg = () => {
    switch (activeSidebar) {
      case "dashboard": return "bg-gray-50";
      case "payments": return "bg-indigo-50";
      case "withdraw": return "bg-green-50";
      default: return "bg-white";
    }
  };

  return (
    <div className="min-h-screen bg-bgpage text-textmain px-6 py-8 grid md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <aside className="md:col-span-1 bg-white rounded-card shadow-card p-4 sticky top-4 h-fit">
        <div className="mb-6 pb-4 border-b border-gray-200 flex flex-col">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-primary">แผงควบคุมผู้ดูแล</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">ระบบจัดการทั้งหมด</p>
        </div>

        <nav className="space-y-2 text-sm">
          {/* หมวดจัดการระบบ */}
          <div className="space-y-2">
            <button
              onClick={() => setManagementOpen(!managementOpen)}
              className="w-full text-left block px-3 py-2 rounded-pill shadow transition flex justify-between items-center hover:bg-primary/10 hover:text-primary"
            >
              <span className="font-medium flex items-center gap-2">
                <BarChart2 className="w-4 h-4"/> จัดการระบบ
              </span>
              <span className={`transform transition-transform duration-200 ${managementOpen ? "rotate-90" : ""}`}>
                ▶
              </span>
            </button>
            
            {managementOpen && (
              <div className="pl-4 space-y-2">
                <button
                  onClick={() => setActiveSidebar("dashboard")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "dashboard" ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2"><BarChart2 className="w-4 h-4"/> หน้าหลัก</span>
                </button>
                <button
                  onClick={() => setActiveSidebar("users")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "users" ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2"><Users className="w-4 h-4"/> ผู้ใช้งาน</span>
                </button>
                <button
                  onClick={() => setActiveSidebar("products")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "products" ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2"><Box className="w-4 h-4"/> สินค้า</span>
                </button>
                <button
                  onClick={() => setActiveSidebar("categories")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "categories" ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2"><Tag className="w-4 h-4"/> ประเภทสินค้า</span>
                </button>
                <button
                  onClick={() => setActiveSidebar("orders")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "orders" ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4"/> คำสั่งซื้อ</span>
                </button>
              </div>
            )}
          </div>

          {/* หมวดการเงิน */}
          <div className="space-y-2 mt-4">
            <button
              onClick={() => setFinancialOpen(!financialOpen)}
              className="w-full text-left block px-3 py-2 rounded-pill shadow transition flex justify-between items-center hover:bg-primary/10 hover:text-primary"
            >
              <span className="font-medium flex items-center gap-2"><CreditCard className="w-4 h-4"/> การเงิน</span>
              <span className={`transform transition-transform duration-200 ${financialOpen ? "rotate-90" : ""}`}>
                ▶
              </span>
            </button>
            
            {financialOpen && (
              <div className="pl-4 space-y-2">
                <button
                  onClick={() => setActiveSidebar("payments")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "payments" ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2"><CreditCard className="w-4 h-4"/> ประวัติการชำระเงิน</span>
                </button>
                <button
                  onClick={() => setActiveSidebar("withdraw")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "withdraw" ? "bg-primary text-white" : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className="flex items-center gap-2"><Banknote className="w-4 h-4"/> คำขอถอนเงิน</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <section className={`md:col-span-3 rounded-card shadow-card p-6 w-full flex flex-col ${getSectionBg()} transition-all duration-300`}>
        {/* Dashboard */}
        {activeSidebar === "dashboard" && (
          <div className="space-y-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5"/>
              <h1 className="text-2xl font-bold text-gray-800">ภาพรวมระบบ</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">ข้อมูลสรุปทั้งหมดของระบบ</p>
            <DashboardStats
              totalUsers={dashboard?.totalUsers ?? 0}
              totalStores={dashboard?.totalStores ?? 0}
              totalProducts={dashboard?.totalProducts ?? 0}
              totalOrders={dashboard?.totalOrders ?? 0}
            />
            <RecentOrders orders={dashboard?.recentOrders ?? []} />
          </div>
        )}

        {/* Users */}
        {activeSidebar === "users" && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <Users className="w-5 h-5"/>
              <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">รายชื่อผู้ใช้งานทั้งหมด</p>
            <UsersTable users={(dashboard?.allUsers ?? []).map(u => ({
              ...u,
              username: u.username ?? "",
              email: u.email ?? "",
              role: u.role ?? "",
              registration_date: u.registration_date ?? "",
            }))} />
          </div>
        )}

        {/* Products */}
        {activeSidebar === "products" && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <Box className="w-5 h-5"/>
              <h1 className="text-2xl font-bold text-gray-800">จัดการสินค้า</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">สินค้าทั้งหมดในระบบ</p>
            <ProductsTable />
          </div>
        )}

        {/* Categories */}
        {activeSidebar === "categories" && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5"/>
              <h1 className="text-2xl font-bold text-gray-800">จัดการประเภทสินค้า</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">ประเภทสินค้าทั้งหมดในระบบ</p>
            <CategoriesManager />
          </div>
        )}

        {/* Orders */}
        {activeSidebar === "orders" && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5"/>
              <h1 className="text-2xl font-bold text-gray-800">จัดการคำสั่งซื้อ</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">รายการคำสั่งซื้อทั้งหมด</p>
            <OrdersList orders={ordersData} />
          </div>
        )}

        {/* Payments */}
        {activeSidebar === "payments" && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5"/>
              <h1 className="text-2xl font-bold text-gray-800">ประวัติการชำระเงิน</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">รายการชำระเงินทั้งหมด</p>
            <PaymentsTable paymentData={paymentData} />
          </div>
        )}

        {/* Withdraw Requests */}
        {activeSidebar === "withdraw" && (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5"/>
              <h1 className="text-2xl font-bold text-gray-800">คำขอถอนเงิน</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">รายการคำขอถอนเงินที่รออนุมัติ</p>
            <WithdrawalList withdrawals={withdrawals} onApprove={openModal} />
          </div>
        )}
      </section>

      {/* Payment Modal */}
      {modalOpen && currentWithdrawal && (
        <PaymentModal
          withdrawal={currentWithdrawal}
          token={localStorage.getItem("token")!}
          onClose={closeModal}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
