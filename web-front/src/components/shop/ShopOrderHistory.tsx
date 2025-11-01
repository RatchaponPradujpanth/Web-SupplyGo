"use client";

import { useEffect, useState } from "react";
import {
  getShopOrderHistory,
  updateStatus,
  updateTrackingNumber,
  ShopOrderResponse,
} from "@/service/api/shop/ordershophistory";
import { useToast } from "@/components/Toast";

import {
  MapPin,
  Package,
  ClipboardCopy,
  AlertCircle,
  CheckCircle,
  CreditCard,
} from "lucide-react";

interface NormalOrderUI {
  order_shop_id: number;
  order_id: number;
  shop_id: number;
  subtotal: number;
  status: string;
  tracking_number?: string;
  transaction_id?: string;
  order_date?: string;
  user_info?: {
    username?: string;
    email?: string;
  };
  address?: {
    firstname?: string;
    lastname?: string;
    phone_number?: number;
    house_number?: string;
    street?: string;
    sub_district?: string;
    district?: string;
    province?: string;
    postal_code?: number;
    address_type?: string;
  };
  items: {
    order_item_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    image_url?: string;
    variant_option?: {
      option_name: string;
      value: string;
    };
  }[];
}

/* TrackingInput component */
function TrackingInput({
  orderShopId,
  initialTracking,
  onSaved,
  showToast,
}: {
  orderShopId: number;
  initialTracking: string | null;
  onSaved?: (newTracking: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [saved, setSaved] = useState(!!initialTracking);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTracking(initialTracking ?? "");
    setSaved(!!initialTracking);
  }, [initialTracking]);

  const handleSave = async () => {
    if (!tracking.trim()) {
      showToast("กรุณากรอกเลขพัสดุ", "warning");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("ไม่พบ token", "error");
      return;
    }

    try {
      setSaving(true);
      await updateTrackingNumber(token, orderShopId, tracking.trim());
      setSaved(true);
      showToast("บันทึกเลขพัสดุสำเร็จ", "success");
      if (onSaved) onSaved(tracking.trim());
    } catch (error) {
      console.error(error);
      showToast("บันทึกเลขพัสดุไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!tracking) return;
    navigator.clipboard.writeText(tracking);
    showToast("คัดลอกเลขพัสดุแล้ว", "success");
  };

  if (saved && tracking) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          เลขพัสดุ: <span className="font-semibold">{tracking}</span>
        </span>
        <button
          onClick={handleCopy}
          className="bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300 text-xs flex items-center gap-1"
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
          Copy
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <input
        type="text"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="กรอกเลขพัสดุ..."
        className="border border-gray-300 rounded-md px-3 py-1.5 w-full sm:w-60 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
      >
        {saving ? (
          <>
            <AlertCircle className="w-4 h-4" /> กำลังบันทึก...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" /> บันทึก
          </>
        )}
      </button>
    </div>
  );
}

export default function ShopOrderHistory() {
  const [orders, setOrders] = useState<NormalOrderUI[]>([]);
  const [statusInputs, setStatusInputs] = useState<{ [key: string]: string }>({});
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [trackingFilter, setTrackingFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const transformNormalOrders = (res: ShopOrderResponse): NormalOrderUI[] => {
    return (res.normalOrders || []).map((order) => ({
      order_shop_id: order.order_shop_id,
      order_id: order.order_id,
      shop_id: order.shop_id,
      subtotal: Number(order.subtotal ?? 0),
      status: order.status,
      tracking_number: order.tracking_number,
      transaction_id: order.transaction_id,
      order_date: order.order?.order_date,
      user_info: order.order?.users
        ? {
            username: order.order.users.username ?? "ไม่ระบุ",
            email: order.order.users.email ?? "ไม่ระบุ",
          }
        : undefined,
      address: order.order?.address
        ? {
            firstname: order.order.address.firstname,
            lastname: order.order.address.lastname,
            phone_number: order.order.address.phone_number,
            house_number: order.order.address.house_number,
            street: order.order.address.street,
            sub_district: order.order.address.sub_district,
            district: order.order.address.district,
            province: order.order.address.province,
            postal_code: order.order.address.postal_code,
            address_type: order.order.address.address_type,
          }
        : undefined,
      items: (order.order_items || []).map((item) => {
        const product = item.products || item.product;
        return {
          order_item_id: item.order_item_id,
          product_id: product?.product_id ?? item.product_id ?? 0,
          product_name: product?.product_name ?? "ไม่ระบุสินค้า",
          quantity: item.quantity,
          price_per_unit: Number(item.price_per_unit ?? 0),
          total_price: Number(item.total_price ?? 0),
          image_url: product?.product_images?.[0]?.image_url,
          variant_option: item.variant_option
            ? {
                option_name: item.variant_option.option?.name ?? "ตัวเลือก",
                value: item.variant_option.value ?? "",
              }
            : undefined,
        };
      }),
    }));
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await getShopOrderHistory(token, trackingFilter.trim() || undefined);
      const normalOrders = transformNormalOrders(res);
      setOrders(normalOrders);

      const initialStatus: { [key: string]: string } = {};
      normalOrders.forEach((os) => {
        initialStatus[os.order_shop_id] = os.status;
      });
      setStatusInputs(initialStatus);
    } catch (err) {
      console.error("❌ โหลดข้อมูลล้มเหลว:", err);
      showToast("โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ", "error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trackingFilter]);

  const handleStatusChange = (orderShopId: number, value: string) => {
    setStatusInputs((prev) => ({ ...prev, [orderShopId]: value }));
  };

  const handleSaveStatus = async (orderShopId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const newStatus = statusInputs[orderShopId];
    if (!newStatus) return;

    try {
      setSavingIds((prev) => [...prev, String(orderShopId)]);
      await updateStatus(token, orderShopId, newStatus);
      showToast("อัปเดตสถานะสำเร็จ", "success");
      await fetchData();
    } catch (error) {
      console.error("❌ อัปเดตสถานะล้มเหลว:", error);
      showToast("เกิดข้อผิดพลาดในการอัปเดตสถานะ", "error");
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== String(orderShopId)));
    }
  };

  if (loading) return <div className="text-center py-8">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="w-full space-y-6 px-4">
      <h1 className="text-3xl font-bold mb-6">ประวัติคำสั่งซื้อร้านค้า</h1>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">ไม่มีคำสั่งซื้อทั่วไป</div>
      ) : (
        orders.map((order) => (
          <div
            key={order.order_shop_id}
            className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4 pb-4 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  คำสั่งซื้อ #{order.order_shop_id}
                </h3>
                {order.user_info && (
                  <p className="text-sm text-gray-600 mt-1">
                    ลูกค้า: <span className="font-semibold">{order.user_info.username}</span>{" "}
                    ({order.user_info.email})
                  </p>
                )}
                {order.order_date && (
                  <p className="text-sm text-gray-500">
                    วันที่สั่ง: {new Date(order.order_date).toLocaleString("th-TH")}
                  </p>
                )}
                {order.transaction_id && (
                  <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Transaction: {order.transaction_id}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ฿{Number(order.subtotal ?? 0).toFixed(2)}
                </div>
                <div
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-800"
                      : order.status === "Shipped"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.status}
                </div>
              </div>
            </div>

            {order.address && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-600" /> ที่อยู่จัดส่ง:
                </h4>
                <p className="text-sm text-gray-600">
                  {order.address.firstname} {order.address.lastname} |{" "}
                  {order.address.phone_number}
                </p>
                <p className="text-sm text-gray-600">
                  {order.address.house_number} {order.address.street},{" "}
                  {order.address.sub_district}, {order.address.district},{" "}
                  {order.address.province} {order.address.postal_code}
                </p>
                {order.address.address_type && (
                  <span className="inline-block mt-1 text-xs bg-gray-200 px-2 py-0.5 rounded">
                    {order.address.address_type}
                  </span>
                )}
              </div>
            )}

            <div className="mb-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                <Package className="w-4 h-4 text-gray-600" /> รายการสินค้า:
              </h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.order_item_id}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.product_name}</div>
                      {item.variant_option && (
                        <div className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded inline-block mt-1">
                          {item.variant_option.option_name}: {item.variant_option.value}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">
                        {item.quantity} ชิ้น × ฿{Number(item.price_per_unit).toFixed(2)} =
                        <span className="font-semibold text-gray-800 ml-1">
                          ฿
                          {Number(
                            item.total_price || item.price_per_unit * item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2">
              <TrackingInput
                orderShopId={order.order_shop_id}
                initialTracking={order.tracking_number || null}
                onSaved={(newTracking) =>
                  setOrders((prev) =>
                    prev.map((o) =>
                      o.order_shop_id === order.order_shop_id
                        ? { ...o, tracking_number: newTracking }
                        : o
                    )
                  )
                }
                showToast={showToast}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={statusInputs[order.order_shop_id] || ""}
                onChange={(e) => handleStatusChange(order.order_shop_id, e.target.value)}
              >
                <option value="Pending">รอดำเนินการ</option>
                <option value="Shipped">กำลังจัดส่ง</option>
                <option value="Delivered">จัดส่งสำเร็จ</option>
                <option value="Cancelled">ยกเลิก</option>
              </select>
              <button
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition"
                onClick={() => handleSaveStatus(order.order_shop_id)}
                disabled={savingIds.includes(String(order.order_shop_id))}
              >
                {savingIds.includes(String(order.order_shop_id))
                  ? "กำลังบันทึก..."
                  : "บันทึกสถานะ"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}