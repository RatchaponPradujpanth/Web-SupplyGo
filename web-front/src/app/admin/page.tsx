"use client";

import { useEffect, useState } from "react";
import { admindashboard } from "@/service/api/adminDashboard";
import { loadShopProducts } from "@/service/api/loadproduct";
import { paymentHistory } from "@/service/api/groupsharing/admin/paymenthistory";
import { allOrderHistory } from "@/service/api/groupsharing/admin/allorderhistory";
import { getPendingWithdrawals } from "@/service/api/groupsharing/admin/getPendingWithdrawals";
import type {
  AdminDashboardApiResponse,
  Product,
  PaymentHistoryOrder,
  AdminOrderHistoryOrder,
} from "@/types/type";

// Import Components
import DashboardStats from "@/components/admin/DashboardStats";
import RecentOrders from "@/components/admin/RecentOrders";
import UsersTable from "@/components/admin/UsersTable";
import ProductsTable from "@/components/admin/ProductsTable";
import OrdersList from "@/components/admin/OrdersList";
import PaymentsTable from "@/components/admin/PaymentsTable";
import WithdrawalList from "@/components/admin/WithdrawalList";
import PaymentModal from "@/components/admin/PaymentModalProps ";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentHistoryOrder[]>([]);
  const [ordersData, setOrdersData] = useState<AdminOrderHistoryOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<
    "dashboard" | "users" | "products" | "orders" | "payments" | "withdraw"
  >("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentWithdrawal, setCurrentWithdrawal] = useState<Withdrawal | null>(null);
  
  // ✅ เพิ่ม state สำหรับ collapsible menu
  const [managementOpen, setManagementOpen] = useState(true);
  const [financialOpen, setFinancialOpen] = useState(true);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found");
          setLoading(false);
          return;
        }
        const res = await admindashboard(token);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Fetch products when Products sidebar is active
  useEffect(() => {
    if (activeSidebar === "products") {
      const fetchProducts = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            setError("No token found");
            setLoading(false);
            return;
          }
          const res = await loadShopProducts(token);
          setProducts(res);
        } catch (err: any) {
          setError(err.message || "Failed to load products");
        }
      };
      fetchProducts();
    }
  }, [activeSidebar]);

  // Fetch payment history when Payments sidebar is active
  useEffect(() => {
    if (activeSidebar === "payments") {
      const fetchPayments = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("No token found");
          const res = await paymentHistory(token);
          setPaymentData(res);
        } catch (err: any) {
          setError(err.message || "Failed to load payment history");
        } finally {
          setLoading(false);
        }
      };
      fetchPayments();
    }
  }, [activeSidebar]);

  // Fetch all orders when Orders sidebar is active
  useEffect(() => {
    if (activeSidebar === "orders") {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("No token found");
          const res = await allOrderHistory(token);
          setOrdersData(res);
        } catch (err: any) {
          setError(err.message || "Failed to load orders");
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeSidebar]);

  // Fetch withdrawals when Withdraw sidebar is active
  useEffect(() => {
    if (activeSidebar === "withdraw") {
      const fetchWithdrawals = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("No token found");
          const res = await getPendingWithdrawals(token);
          setWithdrawals(res.withdrawals || []);
        } catch (err: any) {
          setError(err.message || "Failed to load withdrawals");
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
    alert("✅ จ่ายเงินและอนุมัติสำเร็จ");
  };

  //if (loading) return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6 text-gray-600">No data available</div>;

  const { dashboard } = data;

  const getSectionBg = () => {
    switch (activeSidebar) {
      case "dashboard":
        return "bg-gray-50";
      case "payments":
        return "bg-indigo-50";
      case "withdraw":
        return "bg-green-50";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="min-h-screen bg-bgpage text-textmain px-6 py-8 grid md:grid-cols-4 gap-6">
      {/* Sidebar - ปรับให้เหมือน Store Dashboard */}
      <aside className="md:col-span-1 bg-white rounded-card shadow-card p-4 sticky top-4 h-fit">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-primary">⚙️ Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">ระบบจัดการ</p>
        </div>

        <nav className="space-y-2 text-sm">
          {/* หมวดจัดการระบบ */}
          <div className="space-y-2">
            <button
              onClick={() => setManagementOpen(!managementOpen)}
              className="w-full text-left block px-3 py-2 rounded-pill shadow transition flex justify-between items-center hover:bg-primary/10 hover:text-primary"
            >
              <span className="font-medium">📊 จัดการระบบ</span>
              <span
                className={`transform transition-transform duration-200 ${
                  managementOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            </button>
            
            {managementOpen && (
              <div className="pl-4 space-y-2">
                <button
                  onClick={() => setActiveSidebar("dashboard")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "dashboard"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  🏠 Dashboard
                </button>
                <button
                  onClick={() => setActiveSidebar("users")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "users"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  👥 ผู้ใช้งาน
                </button>
                <button
                  onClick={() => setActiveSidebar("products")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "products"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  📦 สินค้า
                </button>
                <button
                  onClick={() => setActiveSidebar("orders")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "orders"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  🛒 คำสั่งซื้อ
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
              <span className="font-medium">💰 การเงิน</span>
              <span
                className={`transform transition-transform duration-200 ${
                  financialOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
            </button>
            
            {financialOpen && (
              <div className="pl-4 space-y-2">
                <button
                  onClick={() => setActiveSidebar("payments")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "payments"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  💳 ประวัติการชำระเงิน
                </button>
                <button
                  onClick={() => setActiveSidebar("withdraw")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition ${
                    activeSidebar === "withdraw"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  🏦 คำขอถอนเงิน
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content - ปรับให้มี background สีสันเหมือน Store */}
      <section
        className={`md:col-span-3 rounded-card shadow-card p-6 w-full flex flex-col ${getSectionBg()} transition-all duration-300`}
      >
        {/* Dashboard */}
        {activeSidebar === "dashboard" && (
          <div className="space-y-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">📊 Dashboard Overview</h1>
              <p className="text-sm text-gray-500 mt-1">ภาพรวมระบบทั้งหมด</p>
            </div>
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
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">👥 จัดการผู้ใช้งาน</h1>
              <p className="text-sm text-gray-500 mt-1">รายชื่อผู้ใช้งานทั้งหมด</p>
            </div>
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
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">📦 จัดการสินค้า</h1>
              <p className="text-sm text-gray-500 mt-1">สินค้าทั้งหมดในระบบ</p>
            </div>
            <ProductsTable products={products} />
          </div>
        )}

        {/* Orders */}
        {activeSidebar === "orders" && (
          <div className="space-y-4">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">🛒 จัดการคำสั่งซื้อ</h1>
              <p className="text-sm text-gray-500 mt-1">รายการสั่งซื้อทั้งหมด</p>
            </div>
            <OrdersList orders={ordersData} />
          </div>
        )}

        {/* Payments */}
        {activeSidebar === "payments" && (
          <div className="space-y-4">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">💳 ประวัติการชำระเงิน</h1>
              <p className="text-sm text-gray-500 mt-1">รายการชำระเงินทั้งหมด</p>
            </div>
            <PaymentsTable paymentData={paymentData} />
          </div>
        )}

        {/* Withdraw Requests */}
        {activeSidebar === "withdraw" && (
          <div className="space-y-4">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">🏦 คำขอถอนเงิน</h1>
              <p className="text-sm text-gray-500 mt-1">รายการคำขอถอนเงินที่รออนุมัติ</p>
            </div>
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