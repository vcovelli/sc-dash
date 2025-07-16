// UserTable.tsx
import { useState } from "react";
import { updateUserRole, deleteUser } from "@/lib/invitesAPI";
import { User } from "@/types";
import { FaTrash, FaEdit, FaUser } from "react-icons/fa";
import toast from "react-hot-toast";

type Props = {
  users: User[];
  onAction?: () => void;
  canManage: boolean;
};

// Role hierarchy for proper management
const ROLE_HIERARCHY = {
  admin: 100,
  owner: 90,
  ceo: 80,
  national_manager: 70,
  regional_manager: 60,
  local_manager: 50,
  employee: 40,
  client: 30,
  tech_support: 20,
  read_only: 10,
  custom: 5,
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Platform Admin", icon: "👑" },
  { value: "owner", label: "Organization Owner", icon: "🏢" },
  { value: "ceo", label: "CEO/Global Access", icon: "🌟" },
  { value: "national_manager", label: "National Manager", icon: "🌍" },
  { value: "regional_manager", label: "Regional Manager", icon: "🗺️" },
  { value: "local_manager", label: "Site Manager", icon: "📍" },
  { value: "employee", label: "Employee", icon: "👤" },
  { value: "client", label: "Client/Partner", icon: "🤝" },
  { value: "tech_support", label: "Tech Support", icon: "🔧" },
  { value: "read_only", label: "Read Only", icon: "👁️" },
  { value: "custom", label: "Custom Role", icon: "⚙️" },
];

export default function UserTable({ users, onAction, canManage }: Props) {
  const [editingRoles, setEditingRoles] = useState<{ [key: number]: boolean }>({});

  const handleRemoveUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to remove ${user.username}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      toast.success(`User ${user.username} removed successfully`);
      onAction?.();
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      await updateUserRole(user.id, newRole);
      toast.success(`Role updated to ${ROLE_OPTIONS.find(r => r.value === newRole)?.label}`);
      setEditingRoles(prev => ({ ...prev, [user.id]: false }));
      onAction?.();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const getRoleIcon = (role: string) => {
    const roleInfo = ROLE_OPTIONS.find(r => r.value === role);
    return roleInfo?.icon || "❓";
  };

  const getRoleBadgeColor = (role: string) => {
    const level = ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;
    if (level >= 80) return "bg-gradient-to-r from-purple-500 to-pink-600 text-white";
    if (level >= 60) return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white";
    if (level >= 40) return "bg-gradient-to-r from-green-500 to-teal-600 text-white";
    if (level >= 20) return "bg-gradient-to-r from-orange-500 to-red-500 text-white";
    return "bg-gradient-to-r from-gray-400 to-gray-600 text-white";
  };

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <FaUser className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No users found</p>
        <p className="text-sm">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">
              User
            </th>
            <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">
              Role
            </th>
            <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">
              Status
            </th>
            <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">
              Joined
            </th>
            {canManage && (
              <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {/* User Info */}
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                    {user.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.username}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>

              {/* Role */}
              <td className="py-4 px-6">
                {editingRoles[user.id] && canManage ? (
                  <div className="flex gap-2">
                    <select
                      defaultValue={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400"
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.icon} {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setEditingRoles(prev => ({ ...prev, [user.id]: false }))}
                      className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      <span>{getRoleIcon(user.role)}</span>
                      {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                    </span>
                    {canManage && (
                      <button
                        onClick={() => setEditingRoles(prev => ({ ...prev, [user.id]: true }))}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                        title="Edit role"
                      >
                        <FaEdit size={12} />
                      </button>
                    )}
                  </div>
                )}
              </td>

              {/* Status */}
              <td className="py-4 px-6">
                <StatusBadge user={user} />
              </td>

              {/* Joined Date */}
              <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                {new Date(user.date_joined).toLocaleDateString()}
              </td>

              {/* Actions */}
              {canManage && (
                <td className="py-4 px-6">
                  <button
                    onClick={() => handleRemoveUser(user)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove user"
                  >
                    <FaTrash size={12} />
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ user }: { user: User }) {
  if (user.is_active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        Active
      </span>
    );
  }
  
  if (user.is_pending) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
        Pending
      </span>
    );
  }
  
  if (user.is_suspended) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
        Suspended
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
      Unknown
    </span>
  );
}
