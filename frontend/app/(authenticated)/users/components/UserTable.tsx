// UserTable.tsx
import { useState } from "react";
import { updateUserRole } from "@/lib/invitesAPI";
import toast from "react-hot-toast";

type User = {
  id: number;
  email: string;
  role: string;
  username: string;
  date_joined: string;
  is_active?: boolean;
  is_pending?: boolean;
  is_suspended?: boolean;
};

type Props = {
  users: User[];
  onAction?: (user: User, action: string) => void;
};

export default function UserTable({ users, onAction }: Props) {
  function handleRemove(user: User, onAction?: (user: User, action: string) => void) {
    if (window.confirm(`Remove user ${user.email}?`)) {
      onAction?.(user, "remove");
    }
  }

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
              <button className="btn-danger" onClick={() => handleRemove(u, onAction)}>
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type RoleDropdownProps = {
  user: User;
  onChanged?: (user: User, action: string) => void;
};

function RoleDropdown({ user, onChanged }: RoleDropdownProps) {
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
        onChanged?.(user, "roleChanged");
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

type StatusBadgeProps = {
  user: User;
};
function StatusBadge({ user }: StatusBadgeProps) {
  if (user.is_active) return <span className="badge badge-success">Active</span>;
  if (user.is_pending) return <span className="badge badge-warning">Pending</span>;
  if (user.is_suspended) return <span className="badge badge-error">Suspended</span>;
  return <span className="badge">Unknown</span>;
}
