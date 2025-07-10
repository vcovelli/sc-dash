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

interface RoleSelectProps {
  user: { id: string; email: string; role: string }; // adjust fields as needed
  onChanged: (newRole: string) => void;
}

export default function RoleSelect({ user, onChanged }: RoleSelectProps) {
  const [role, setRole] = useState(user.role);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setRole(newRole);
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(
        `/api/accounts/org/users/${user.id}/`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onChanged(newRole);
    } catch {
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
