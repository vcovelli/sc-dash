// RoleSelect.tsx
import { useState } from "react";
import axios from "axios";

const ROLES = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "employee", label: "Employee" },
  { value: "client", label: "Client" },
  // ...add more as needed
];

export default function RoleSelect({ user, onChanged }) {
  const [role, setRole] = useState(user.role);

  const handleChange = async (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `/api/accounts/org/users/${user.id}/`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onChanged();
    } catch (err) {
      alert("Failed to update role");
      setRole(user.role); // revert if error
    }
  };

  return (
    <select className="border p-1 rounded" value={role} onChange={handleChange}>
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}
