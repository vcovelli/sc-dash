"use client";

import { useState, useEffect } from "react";
import { TrashIcon, PencilIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import { FaUsers, FaUserPlus, FaClock, FaShieldAlt, FaEnvelope, FaSearch } from "react-icons/fa";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";
import { useUserSettings } from "@/components/UserSettingsContext";

const ROLE_CHOICES = [
  { value: "owner", label: "Organization Owner", description: "Full access to everything" },
  { value: "ceo", label: "CEO/Executive", description: "Global access to all data" },
  { value: "national_manager", label: "National Manager", description: "Manage national operations" },
  { value: "regional_manager", label: "Regional Manager", description: "Manage regional operations" },
  { value: "local_manager", label: "Local Manager", description: "Manage local site operations" },
  { value: "employee", label: "Employee", description: "Basic access and operations" },
  { value: "client", label: "Client/Partner", description: "Limited external access" },
  { value: "read_only", label: "Read Only", description: "View-only access" },
];

function getRoleLabel(role: string) {
  return ROLE_CHOICES.find((r) => r.value === role)?.label || role;
}

function getRoleBadgeColor(role: string) {
  const colors: { [key: string]: string } = {
    admin: "bg-purple-100 text-purple-800",
    owner: "bg-red-100 text-red-800",
    ceo: "bg-blue-100 text-blue-800",
    national_manager: "bg-green-100 text-green-800",
    regional_manager: "bg-yellow-100 text-yellow-800",
    local_manager: "bg-orange-100 text-orange-800",
    employee: "bg-gray-100 text-gray-800",
    client: "bg-indigo-100 text-indigo-800",
    read_only: "bg-slate-100 text-slate-800",
  };
  return colors[role] || "bg-gray-100 text-gray-800";
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newInvite, setNewInvite] = useState({ email: "", role: "employee" });
  const { userRole } = useUserSettings();

  // Permission gating
  const canManageUsers = userRole?.canManageUsers || false;
  const canInviteUsers = userRole?.canInviteUsers || false;

  // --- API Fetch ---
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/accounts/org/users/", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) {
        const responseData = await response.json();
        setUsers(responseData.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/accounts/invitations/pending/", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  };

  const refresh = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchInvitations()]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, []);

  // --- Filtering ---
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Unique role list
  const availableRoles = [...new Set(users.map((u) => u.role))];

  // --- Actions ---
  const sendInvitation = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/accounts/invite/send/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newInvite),
      });
      if (response.ok) {
        alert(`Invitation sent to ${newInvite.email}!`);
        setNewInvite({ email: "", role: "employee" });
        setShowInviteModal(false);
        fetchInvitations();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to send invitation"}`);
      }
    } catch (err) {
      console.error("Error sending invitation:", err);
      alert("Failed to send invitation");
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/accounts/org/users/${userId}/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        fetchUsers();
        setEditingUser(null);
        alert("User role updated successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to update user"}`);
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user");
    }
  };

  const removeUser = async (userId: number, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from your organization?`)) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/accounts/org/users/${userId}/remove/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) {
        fetchUsers();
        alert("User removed successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to remove user"}`);
      }
    } catch (err) {
      console.error("Error removing user:", err);
      alert("Failed to remove user");
    }
  };

  const cancelInvitation = async (invitationId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`/api/accounts/invitations/${invitationId}/cancel/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) {
        fetchInvitations();
        alert("Invitation cancelled!");
      } else {
        alert("Failed to cancel invitation");
      }
    } catch (err) {
      console.error("Error cancelling invitation:", err);
      alert("Failed to cancel invitation");
    }
  };

  // --- Permission gate ---
  if (!canManageUsers && !canInviteUsers) {
    return (
      <FontSizeVarsProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500 flex justify-center items-center px-4"
          style={{ fontSize: "var(--body)" }}>
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-900/30 p-8 text-center max-w-md">
            <FaShieldAlt className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2"
              style={{ fontSize: "var(--h2)" }}>
              Access Restricted
            </h2>
            <p className="text-gray-600 dark:text-gray-300"
              style={{ fontSize: "var(--body)" }}>
              You don't have permission to access user management. Contact your organization administrator.
            </p>
          </div>
        </div>
      </FontSizeVarsProvider>
    );
  }

  // --- MAIN UI ---
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const pendingInvites = invitations.length;

  return (
    <FontSizeVarsProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500 px-4 py-6"
        style={{ fontSize: "var(--body)" }}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3"
                style={{ fontSize: "var(--h1)" }}>
                <FaUsers className="text-blue-600 dark:text-blue-400" />
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1"
                style={{ fontSize: "var(--body)" }}>
                Manage your organization's team members and permissions
              </p>
            </div>
            {canInviteUsers && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                style={{ fontSize: "var(--body)" }}
              >
                <FaUserPlus />
                Invite User
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<FaUsers className="text-blue-500" />}
              title="Total Users"
              value={totalUsers}
              subtitle={`${activeUsers} active`}
            />
            <StatCard
              icon={<FaShieldAlt className="text-green-500" />}
              title="Active Users"
              value={activeUsers}
              subtitle={`${totalUsers - activeUsers} inactive`}
            />
            <StatCard
              icon={<FaClock className="text-orange-500" />}
              title="Pending Invites"
              value={pendingInvites}
              subtitle="Awaiting response"
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 transition"
                  style={{ fontSize: "var(--body)" }}
                />
              </div>
              <div className="lg:w-64">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 transition"
                  style={{ fontSize: "var(--body)" }}
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "var(--body)" }}>
                Loading team members...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Users Table */}
              <div className="xl:col-span-2">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                      style={{ fontSize: "var(--h3)" }}>
                      <FaUsers className="text-blue-500" />
                      Team Members ({filteredUsers.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.first_name} {user.last_name}
                                  {user.business_name && (
                                    <span className="text-gray-500"> ({user.business_name})</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.last_login
                                ? new Date(user.last_login).toLocaleDateString()
                                : "Never"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.total_files}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {user.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setEditingUser(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => removeUser(user.id, user.email)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pending Invites */}
              <div className="xl:col-span-1">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                      style={{ fontSize: "var(--h3)" }}>
                      <FaEnvelope className="text-orange-500" />
                      Pending Invites ({invitations.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited By</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {invitations.map((inv) => (
                          <tr key={inv.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {inv.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(inv.role)}`}>
                                {getRoleLabel(inv.role)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {inv.invited_by}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(inv.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => cancelInvitation(inv.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invite User Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-900">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Invite New User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newInvite.email}
                      onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Role
                    </label>
                    <select
                      value={newInvite.role}
                      onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    >
                      {ROLE_CHOICES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendInvitation}
                    disabled={!newInvite.email}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send Invitation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-900">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Edit User: {editingUser.email}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Role
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white"
                    >
                      {ROLE_CHOICES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {ROLE_CHOICES.find((r) => r.value === editingUser.role)?.description}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateUserRole(editingUser.id, editingUser.role)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FontSizeVarsProvider>
  );
}

// Stats Card
function StatCard({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string; value: number; subtitle: string }) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 p-6">
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400" style={{ fontSize: "var(--small)" }}>
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontSize: "var(--h2)" }}>
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400" style={{ fontSize: "var(--small)" }}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
