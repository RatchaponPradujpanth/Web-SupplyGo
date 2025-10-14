interface Product {
  product_id: number;
  product_name: string | null;
  price: number | null;
  status: string | null;
  product_images?: Array<{
    image_url: string;
  }>;
}

interface ProductsTableProps {
  products: Product[];
}

export default function ProductsTable({ products }: ProductsTableProps) {
  return (
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
                  <img
                    src={p.product_images[0].image_url}
                    alt={p.product_name ?? ""}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}