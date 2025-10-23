interface User {
  user_id: number;
  username?: string;
  email: string;
  role: string;
  registration_date: string;
}

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
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
          {users?.map((u) => (
            <tr key={u.user_id} className="border-t">
              <td className="p-3">{u.user_id}</td>
              <td className="p-3">{u.username ?? "-"}</td>
              <td className="p-3">{u.email ?? "-"}</td>
              <td className="p-3">{u.role ?? "-"}</td>
              <td className="p-3">
                {u.registration_date
                  ? new Date(u.registration_date).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          )) ?? null}
        </tbody>
      </table>
    </div>
  );
}