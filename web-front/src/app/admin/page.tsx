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
import Sidebar from "@/components/admin/sidebar";
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

  return (
    <div className="bg-bgpage text-textmain min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Sidebar activeSidebar={activeSidebar} setActiveSidebar={setActiveSidebar} />

        {/* Main Content */}
        <section className="md:col-span-3 space-y-6">
          {/* Dashboard */}
          {activeSidebar === "dashboard" && (
            <>
              <DashboardStats
                totalUsers={dashboard?.totalUsers ?? 0}
                totalStores={dashboard?.totalStores ?? 0}
                totalProducts={dashboard?.totalProducts ?? 0}
                totalOrders={dashboard?.totalOrders ?? 0}
              />
              <RecentOrders orders={dashboard?.recentOrders ?? []} />
            </>
          )}

          {/* Users */}
          {activeSidebar === "users" && (
  <UsersTable users={(dashboard?.allUsers ?? []).map(u => ({
    ...u,
    username: u.username ?? "",
    email: u.email ?? "",
    role: u.role ?? "",
    registration_date: u.registration_date ?? "",
  }))} />
)}

          {/* Products */}
          {activeSidebar === "products" && <ProductsTable products={products} />}

          {/* Orders */}
          {activeSidebar === "orders" && <OrdersList orders={ordersData} />}

          {/* Payments */}
          {activeSidebar === "payments" && <PaymentsTable paymentData={paymentData} />}

          {/* Withdraw Requests */}
          {activeSidebar === "withdraw" && (
            <WithdrawalList withdrawals={withdrawals} onApprove={openModal} />
          )}
        </section>
      </main>

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