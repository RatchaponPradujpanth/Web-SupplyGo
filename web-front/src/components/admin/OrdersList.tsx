import type { AdminOrderHistoryOrder } from "@/types/type";

interface OrdersListProps {
  orders: AdminOrderHistoryOrder[];
}

export default function OrdersList({ orders }: OrdersListProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h2 className="font-semibold mb-3">ออเดอร์ทั้งหมด</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.order_id} className="border rounded-lg p-4 space-y-3">
            {/* Order Header */}
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <div className="font-semibold text-base">ออเดอร์:{order.order_id}</div>
                <div className="text-sm text-textmuted">
                  {order.order_date ? new Date(order.order_date).toLocaleString() : "-"}
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">ทั้งหมด:</span> ฿{order.total_amount ?? "-"}
                </div>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status ?? "-"}
                </span>
              </div>
            </div>

            {/* Shipping Address */}
            {order.address && (
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="font-medium mb-1">ที่อยู่จัดส่ง:</div>
                <div className="text-textmuted">
                  {order.address.firstname} {order.address.lastname} |{" "}
                  {order.address.phone_number}
                </div>
                <div className="text-textmuted">
                  {order.address.house_number} {order.address.street}{" "}
                  {order.address.sub_district} {order.address.district}{" "}
                  {order.address.province} {order.address.postal_code}
                </div>
              </div>
            )}

            {/* Order Shops */}
            {order.order_shops.map((shop) => (
              <div
                key={shop.order_shop_id}
                className="border-l-4 border-blue-400 pl-3 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm">{shop.shops.shop_name ?? "-"}</div>
                  <div className="text-sm">
                    <span className="text-textmuted">ยอดรวม:</span> ฿{shop.subtotal ?? "-"}
                  </div>
                </div>

                {shop.tracking_number && (
                  <div className="text-xs text-textmuted">
                    เลขติดต่อ: {shop.tracking_number}
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-2">
                  {shop.order_items.map((item) => (
                    <div
                      key={item.order_item_id}
                      className="flex gap-3 bg-gray-50 rounded p-2"
                    >
                      {item.products.product_images?.[0]?.image_url && (
                        <img
                          src={item.products.product_images[0].image_url}
                          alt={item.products.product_name ?? ""}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 text-sm">
                        <div className="font-medium">
                          {item.products.product_name ?? "-"}
                        </div>
                        {item.variant_option && (
                          <div className="text-xs text-textmuted">
                            {item.variant_option.option?.name}:{" "}
                            {item.variant_option.value}
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
                  <span
                    className={`px-2 py-1 rounded-full ${
                      shop.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : shop.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : shop.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {shop.status ?? "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}