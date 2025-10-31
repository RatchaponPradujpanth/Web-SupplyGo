"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  regisstripe,
} from "@/service/apis";
import type { Product } from "@/types/type";
import AddProductForm from "@/components/AddProductForm";
import ShopOrderHistory from "@/components/shop/ShopOrderHistory";
import GroupOrderList from "@/components/shop/GroupOrderList";
import ShopProductsList from "@/components/shop/ShopProductsList";
import CreateGroupForm from "@/components/shop/CreateGroupForm";
import ShopGraphDashboard from "@/components/shop/ShopGraphDashboard";
import WithdrawPage from "@/components/shop/WithdrawForm";
import ManageGroups from "@/components/shop/ManageGroups";
import { fetchUserRole } from '@/service/api/fetchrole';
import { loadUsername } from "@/service/api/loadusername";
import { loadstorename } from "@/service/api/shop/loadstore";
import { CalendarDays } from "lucide-react";

// ✅ import icons
import {
  Package,
  Store,
  User,
  CheckCircle,
  LogOut,
  PlusCircle,
  ArrowRight,
  BarChart,
  Wallet,
  Users,
  Layers,
} from "lucide-react";

export default function StoreDashboardPage() {
  const [username, setUsername] = useState("");
  const [storeName, setStoreName] = useState("");
  const [shopId, setShopId] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);

  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "add-product"
    | "orders"
    | "orders-group"
    | "product"
    | "create-group"
    | "withdraw"
    | "my-group"
  >("dashboard");

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const prior = new Date();
    prior.setDate(today.getDate() - 7);
    return prior.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const role = await fetchUserRole(token);
      if (role !== "store") {
        router.push("/user-dashboard");
        return;
      }

      const name = await loadUsername(token);
      setUsername(name);

      const store = await loadstorename(token);
      setStoreName(store.shop_name || "");
      setShopId(store.shop_id);
      setPoints(store.points);
      setStripeConnected(Boolean(store.stripe_account_id));
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  const handleAddProductSuccess = async () => {
    setCurrentView("dashboard");
  };

  const getSectionBg = () => {
    switch (currentView) {
      case "dashboard":
        return "bg-gray-50";
      case "withdraw":
        return "bg-indigo-50";
      case "add-product":
        return "bg-blue-50";
      case "create-group":
        return "bg-green-50";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="min-h-screen bg-bgpage text-textmain px-6 py-8 grid md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <aside className="md:col-span-1 bg-white rounded-card shadow-card p-4 sticky top-4 h-fit">
        <nav className="space-y-2 text-sm">
          {/* หมวดทั่วไป */}
          <div className="space-y-2">
            <button
              onClick={() => setGeneralOpen(!generalOpen)}
              className="w-full text-left block px-3 py-2 rounded-pill shadow transition flex justify-between items-center hover:bg-primary/10 hover:text-primary"
            >
              <span className="font-medium">ทั่วไป</span>
              <ArrowRight
                className={`w-4 h-4 transform transition-transform duration-200 ${
                  generalOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {generalOpen && (
              <div className="pl-4 space-y-2">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "dashboard"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <BarChart className="w-4 h-4" /> หน้าหลัก
                </button>
                <button
                  onClick={() => setCurrentView("product")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "product"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Package className="w-4 h-4" /> คลังสินค้า
                </button>
                <button
                  onClick={() => setCurrentView("orders")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "orders"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" /> คำสั่งซื้อ
                </button>
                <button
                  onClick={() => setCurrentView("add-product")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "add-product"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
                </button>
              </div>
            )}
          </div>

          {/* หมวด Group Buying */}
          <div className="space-y-2 mt-4">
            <button
              onClick={() => setGroupOpen(!groupOpen)}
              className="w-full text-left block px-3 py-2 rounded-pill shadow transition flex justify-between items-center hover:bg-primary/10 hover:text-primary"
            >
              <span className="font-medium">Group Buying</span>
              <ArrowRight
                className={`w-4 h-4 transform transition-transform duration-200 ${
                  groupOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {groupOpen && (
              <div className="pl-4 space-y-2">
                <button
                  onClick={() => setCurrentView("orders-group")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "orders-group"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Layers className="w-4 h-4" /> ออเดอร์กรุ๊ป
                </button>
                <button
                  onClick={() => setCurrentView("create-group")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "create-group"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" /> สร้างกรุ๊ป
                </button>
                <button
                  onClick={() => setCurrentView("my-group")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "my-group"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Users className="w-4 h-4" /> กรุ๊ปของฉัน
                </button>
                <button
                  onClick={() => setCurrentView("withdraw")}
                  className={`w-full text-left block px-3 py-2 rounded-pill shadow transition flex items-center gap-2 ${
                    currentView === "withdraw"
                      ? "bg-primary text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Wallet className="w-4 h-4" /> ถอน point
                </button>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full text-left block px-3 py-2 rounded-pill hover:bg-red-600 hover:text-white transition mt-6 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <section
        className={`md:col-span-3 rounded-card shadow-card p-6 w-full flex flex-col ${getSectionBg()} transition-all duration-300`}
      >
        {currentView === "dashboard" && (
          <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <Package className="w-6 h-6" /> แดชบอร์ดหน้าร้าน
                </h1>
                <p className="text-textmuted flex items-center gap-1">
                  <User className="w-4 h-4" /> ยินดีต้อนรับคุณ{" "}
                  <span className="font-semibold">{username}</span>
                </p>
                <p className="text-textmuted flex items-center gap-1">
                  <Store className="w-4 h-4" /> ร้าน:{" "}
                  <span className="font-semibold">{storeName}</span>
                </p>
              </div>
              <div>
                {stripeConnected ? (
                  <p className="text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> เชื่อมต่อ Stripe แล้ว
                  </p>
                ) : (
                  <button
                    onClick={() => regisstripe(localStorage.getItem("token")!)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> เชื่อมบัญชี Stripe
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-card shadow-card p-4 text-center">
                <p className="text-sm text-textmuted">Point ของคุณ</p>
                <p className="text-2xl font-bold">{points}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-6 mt-6 bg-white shadow-sm border border-gray-100 rounded-2xl p-4">
  {/* Start Date */}
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 font-medium mb-1 flex items-center gap-2">
      <CalendarDays className="w-4 h-4 text-indigo-500" />
      วันที่เริ่มต้น
    </label>
    <div className="relative">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-48 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
      />
      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  </div>

  {/* End Date */}
  <div className="flex flex-col">
    <label className="text-sm text-gray-600 font-medium mb-1 flex items-center gap-2">
      <CalendarDays className="w-4 h-4 text-indigo-500" />
      วันที่สิ้นสุด
    </label>
    <div className="relative">
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="w-48 border border-gray-300 text-gray-800 rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
      />
      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    
    </div>
  </div>
</div>

            {shopId && (
              <ShopGraphDashboard
                token={localStorage.getItem("token")!}
                startDate={startDate}
                endDate={endDate}
              />
            )}
          </div>
        )}

        {currentView === "add-product" && (
          <AddProductForm
            onSuccess={handleAddProductSuccess}
            onCancel={() => setCurrentView("dashboard")}
          />
        )}
        {currentView === "orders" && <ShopOrderHistory />}
        {currentView === "orders-group" && <GroupOrderList />}
        {currentView === "product" && <ShopProductsList />}
        {currentView === "create-group" && <CreateGroupForm />}
        {currentView === "withdraw" && <WithdrawPage />}
        {currentView === "my-group" && <ManageGroups />}
      </section>
    </div>
  );
}
