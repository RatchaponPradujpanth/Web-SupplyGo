interface SidebarProps {
  activeSidebar: "dashboard" | "users" | "products" | "orders" | "payments" | "withdraw";
  setActiveSidebar: (value: "dashboard" | "users" | "products" | "orders" | "payments" | "withdraw") => void;
}

export default function Sidebar({ activeSidebar, setActiveSidebar }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "users", label: "Users" },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "payments", label: "Payments" },
    { id: "withdraw", label: "คำร้องถอนเงิน" },
  ] as const;

  return (
    <aside className="md:col-span-1 bg-white rounded-card shadow-card p-4">
      <nav className="space-y-1 text-sm">
        {menuItems.map((item) => (
          <a
            key={item.id}
            className={`block px-3 py-2 rounded-pill cursor-pointer transition-all duration-200 ${
              activeSidebar === item.id
                ? "bg-primary text-white shadow-lg ring-2 ring-blue-400"
                : "hover:bg-primary/10 hover:text-primary"
            }`}
            onClick={() => setActiveSidebar(item.id)}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}