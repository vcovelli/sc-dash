// UserTable.tsx
import { useState } from "react";
import { updateUserRole, deleteUser } from "@/lib/invitesAPI";
import toast from "react-hot-toast";

export default function UserTable({ users, onAction }) {
  const [editUser, setEditUser] = useState(null);

  return (
    <table className="table-auto w-full shadow rounded-xl">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u.id} className="border-t">
            <td>{u.username}</td>
            <td>{u.email}</td>
            <td>
              <RoleDropdown user={u} onChanged={onAction} />
            </td>
            <td>
              <StatusBadge user={u} />
            </td>
            <td>{new Date(u.date_joined).toLocaleDateString()}</td>
            <td>
              <button className="btn-danger" onClick={() => handleRemove(u.id, onAction)}>
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RoleDropdown({ user, onChanged }) {
  const [role, setRole] = useState(user.role);
  return (
    <select
      value={role}
      className="border rounded px-2 py-1"
      onChange={async e => {
        const newRole = e.target.value;
        await updateUserRole(user.id, newRole);
        setRole(newRole);
        toast.success("Role updated!");
        onChanged();
      }}
    >
      {/* Role options */}
      <option value="admin">Admin</option>
      <option value="owner">Owner</option>
      <option value="employee">Employee</option>
      {/* etc */}
    </select>
  );
}

function StatusBadge({ user }) {
  if (user.is_active) return <span className="badge badge-success">Active</span>;
  if (user.is_pending) return <span className="badge badge-warning">Pending</span>;
  if (user.is_suspended) return <span className="badge badge-error">Suspended</span>;
  return <span className="badge">Unknown</span>;
}
