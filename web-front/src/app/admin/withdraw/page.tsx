"use client";

import { useEffect, useState } from "react";
import { admindashboard } from "@/service/api/adminDashboard";
import { loadShopProducts } from "@/service/api/loadproduct";
import { paymentHistory } from "@/service/api/groupsharing/admin/paymenthistory";
import { allOrderHistory } from "@/service/api/groupsharing/admin/allorderhistory";
import { getPendingWithdrawals } from "@/service/api/groupsharing/admin/getPendingWithdrawals";
import { approveWithdrawal } from "@/service/api/groupsharing/admin/approvewithdraw";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { AdminDashboardApiResponse, Product, PaymentHistoryOrder, AdminOrderHistoryOrder } from "@/types/type";

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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

  if (loading) return <div className="p-6 text-gray-600">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6 text-gray-600">No data available</div>;

  const { dashboard } = data;

  return (
    <div className="bg-bgpage text-textmain min-h-screen">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1 bg-white rounded-card shadow-card p-4">
          <nav className="space-y-1 text-sm">
            <a
              className={`block px-3 py-2 rounded-pill cursor-pointer transition-all duration-200 ${
                activeSidebar === "dashboard"
                  ? "bg-primary text-white shadow-lg ring-2 ring-blue-400"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setActiveSidebar("dashboard")}
            >
              Dashboard
            </a>
            <a
              className={`block px-3 py-2 rounded-pill cursor-pointer transition-all duration-200 ${
                activeSidebar === "users"
                  ? "bg-primary text-white shadow-lg ring-2 ring-blue-400"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setActiveSidebar("users")}
            >
              Users
            </a>
            <a
              className={`block px-3 py-2 rounded-pill cursor-pointer transition-all duration-200 ${
                activeSidebar === "products"
                  ? "bg-primary text-white shadow-lg ring-2 ring-blue-400"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setActiveSidebar("products")}
            >
              Products
            </a>
            <a
              className={`block px-3 py-2 rounded-pill cursor-pointer transition-all duration-200 ${
                activeSidebar === "orders"
                  ? "bg-primary text-white shadow-lg ring-2 ring-blue-400"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setActiveSidebar("orders")}
            >
              Orders
            </a>
            <a
              className={`block px-3 py-2 rounded-pill cursor-pointer transition-all duration-200 ${
                activeSidebar === "payments"
                  ? "bg-primary text-white shadow-lg ring-2 ring-blue-400"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setActiveSidebar("payments")}
            >
              Payments
            </a>
            <a
              className={`block px-3 py-2 rounded-pill cursor-pointer transition-all duration-200 ${
                activeSidebar === "withdraw"
                  ? "bg-primary text-white shadow-lg ring-2 ring-blue-400"
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setActiveSidebar("withdraw")}
            >
              คำร้องถอนเงิน
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="md:col-span-3 space-y-6">
          {/* Dashboard */}
          {activeSidebar === "dashboard" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-card shadow-card p-4">
                  <div className="text-xs text-textmuted">Users</div>
                  <div className="text-xl font-semibold mt-1">{dashboard?.totalUsers ?? 0}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                  <div className="text-xs text-textmuted">Shops</div>
                  <div className="text-xl font-semibold mt-1">{dashboard?.totalStores ?? 0}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                  <div className="text-xs text-textmuted">Products</div>
                  <div className="text-xl font-semibold mt-1">{dashboard?.totalProducts ?? 0}</div>
                </div>
                <div className="bg-white rounded-card shadow-card p-4">
                  <div className="text-xs text-textmuted">Orders</div>
                  <div className="text-xl font-semibold mt-1">{dashboard?.totalOrders ?? 0}</div>
                </div>
              </div>

              <div className="bg-white rounded-card shadow-card p-5">
                <h2 className="font-semibold mb-3">Recent Orders</h2>
                <table className="w-full text-sm">
                  <thead className="text-left text-textmuted">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard?.recentOrders?.map((o) => (
                      <tr key={o.order_id} className="border-t">
                        <td className="p-3">{o.order_id}</td>
                        <td className="p-3">{o.users?.username ?? "-"}</td>
                        <td className="p-3">฿{o.total_amount ?? "-"}</td>
                        <td className="p-3">{o.status ?? "-"}</td>
                        <td className="p-3">{o.order_date ? new Date(o.order_date).toLocaleString() : "-"}</td>
                      </tr>
                    )) ?? null}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Users */}
          {activeSidebar === "users" && (
            <div className="bg-white rounded-card shadow-card p-5">
              <h2 className="font-semibold mb-3">All Users</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-textmuted">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Username</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.allUsers?.map((u) => (
                    <tr key={u.user_id} className="border-t">
                      <td className="p-3">{u.user_id}</td>
                      <td className="p-3">{u.username ?? "-"}</td>
                      <td className="p-3">{u.email ?? "-"}</td>
                      <td className="p-3">{u.role ?? "-"}</td>
                      <td className="p-3">{u.registration_date ? new Date(u.registration_date).toLocaleDateString() : "-"}</td>
                    </tr>
                  )) ?? null}
                </tbody>
              </table>
            </div>
          )}

          {/* Products */}
          {activeSidebar === "products" && (
            <div className="bg-white rounded-card shadow-card p-5">
              <h2 className="font-semibold mb-3">All Products</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-textmuted">
                  <tr>
                    <th className="p-3">Product ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.product_id} className="border-t">
                      <td className="p-3">{p.product_id}</td>
                      <td className="p-3">{p.product_name ?? "-"}</td>
                      <td className="p-3">฿{p.price ?? "-"}</td>
                      <td className="p-3">{p.status ?? "-"}</td>
                      <td className="p-3">
                        {p.product_images?.length ? (
                          <img src={p.product_images[0].image_url} alt={p.product_name ?? ""} className="w-16 h-16 object-cover rounded"/>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders */}
          {activeSidebar === "orders" && (
            <div className="bg-white rounded-card shadow-card p-5">
              <h2 className="font-semibold mb-3">All Orders</h2>
              <div className="space-y-4">
                {ordersData.map((order) => (
                  <div key={order.order_id} className="border rounded-lg p-4 space-y-3">
                    {/* Order Header */}
                    <div className="flex justify-between items-start border-b pb-3">
                      <div>
                        <div className="font-semibold text-base">Order #{order.order_id}</div>
                        <div className="text-sm text-textmuted">
                          {order.order_date ? new Date(order.order_date).toLocaleString() : "-"}
                        </div>
                        <div className="text-sm mt-1">
                          <span className="font-medium">Total:</span> ฿{order.total_amount ?? "-"}
                        </div>
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status ?? "-"}
                        </span>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.address && (
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <div className="font-medium mb-1">Shipping Address:</div>
                        <div className="text-textmuted">
                          {order.address.firstname} {order.address.lastname} | {order.address.phone_number}
                        </div>
                        <div className="text-textmuted">
                          {order.address.house_number} {order.address.street} {order.address.sub_district} {order.address.district} {order.address.province} {order.address.postal_code}
                        </div>
                      </div>
                    )}

                    {/* Order Shops */}
                    {order.order_shops.map((shop) => (
                      <div key={shop.order_shop_id} className="border-l-4 border-blue-400 pl-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-sm">{shop.shops.shop_name ?? "-"}</div>
                          <div className="text-sm">
                            <span className="text-textmuted">Subtotal:</span> ฿{shop.subtotal ?? "-"}
                          </div>
                        </div>
                        
                        {shop.tracking_number && (
                          <div className="text-xs text-textmuted">
                            Tracking: {shop.tracking_number}
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="space-y-2">
                          {shop.order_items.map((item) => (
                            <div key={item.order_item_id} className="flex gap-3 bg-gray-50 rounded p-2">
                              {item.products.product_images?.[0]?.image_url && (
                                <img 
                                  src={item.products.product_images[0].image_url} 
                                  alt={item.products.product_name ?? ""} 
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 text-sm">
                                <div className="font-medium">{item.products.product_name ?? "-"}</div>
                                {item.variant_option && (
                                  <div className="text-xs text-textmuted">
                                    {item.variant_option.option?.name}: {item.variant_option.value}
                                  </div>
                                )}
                                <div className="text-xs text-textmuted mt-1">
                                  ฿{item.price_per_unit} x {item.quantity} = ฿{item.total_price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            shop.status === 'completed' ? 'bg-green-100 text-green-700' :
                            shop.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            shop.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {shop.status ?? "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {activeSidebar === "payments" && (
            <div className="bg-white rounded-card shadow-card p-5">
              <h2 className="font-semibold mb-3">Payment History</h2>
              <table className="w-full text-sm">
                <thead className="text-left text-textmuted">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Shop</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentData.map((order) =>
                    order.order_shops.map((shop) => (
                      <tr key={shop.order_shop_id} className="border-t">
                        <td className="p-3">{order.order_id}</td>
                        <td className="p-3">{shop.shops.shop_name ?? "-"}</td>
                        <td className="p-3">฿{shop.subtotal ?? "-"}</td>
                        <td className="p-3">{shop.status ?? "-"}</td>
                        <td className="p-3">{order.order_date ? new Date(order.order_date).toLocaleString() : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Withdraw Requests */}
          {activeSidebar === "withdraw" && (
            <div className="bg-white rounded-card shadow-card p-5">
              <h2 className="font-semibold mb-3">คำร้องถอนเงินที่รออนุมัติ</h2>
              {withdrawals.length === 0 ? (
                <p className="text-textmuted text-center py-8">ไม่มีคำร้องรออนุมัติ</p>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((w) => (
                    <div key={w.store_withdrawals_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">{w.store.shop_name}</div>
                          <div className="text-sm text-textmuted">
                            Withdrawal ID: {w.store_withdrawals_id}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          {w.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-textmuted">จำนวนเงิน:</span>
                          <span className="font-semibold">฿{w.points.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-textmuted">วันที่ขอถอน:</span>
                          <span>{new Date(w.requested_at).toLocaleString('th-TH')}</span>
                        </div>
                        {w.store.stripe_account_id && (
                          <div className="flex justify-between">
                            <span className="text-textmuted">Stripe Account:</span>
                            <span className="text-xs font-mono">{w.store.stripe_account_id.substring(0, 20)}...</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => openModal(w)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        อนุมัติและจ่ายเงิน
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Payment Modal */}
      {modalOpen && currentWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full mx-4">
            <h2 className="text-lg font-bold mb-4">กรอกบัตรเพื่อจ่ายเงิน</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm text-textmuted">ร้าน: {currentWithdrawal.store.shop_name}</div>
              <div className="text-lg font-semibold">จำนวน: ฿{currentWithdrawal.points.toLocaleString()}</div>
            </div>
            <Elements stripe={stripePromise}>
              <CheckoutForm
                withdrawal={currentWithdrawal}
                token={localStorage.getItem("token")!}
                onSuccess={() => {
                  setWithdrawals((prev) =>
                    prev.filter((w) => w.store_withdrawals_id !== currentWithdrawal.store_withdrawals_id)
                  );
                  closeModal();
                  alert("✅ จ่ายเงินและอนุมัติสำเร็จ");
                }}
              />
            </Elements>
            <button
              onClick={closeModal}
              className="mt-4 w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CheckoutFormProps {
  withdrawal: Withdrawal;
  token: string;
  onSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ withdrawal, token, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const res = await approveWithdrawal(token, withdrawal.store_withdrawals_id);
      const clientSecret = res.clientSecret;
      if (!clientSecret) throw new Error("clientSecret ไม่ถูกส่งมา");

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("CardElement ไม่พบ");

      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert("❌ ล้มเหลว: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="border p-3 rounded mb-4">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "กำลังทำรายการ..." : `จ่าย ${withdrawal.points.toLocaleString()} บาท`}
      </button>
    </form>
  );
};