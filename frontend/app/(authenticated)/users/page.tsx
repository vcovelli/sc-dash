"use client";

import { useState, useEffect } from "react";
import { fetchOrgUsers, fetchInvites } from "@/lib/invitesAPI";
import { User, Invite } from "@/types";
import { useUserSettings } from "@/components/UserSettingsContext";
import { FaUsers, FaUserPlus, FaClock, FaShieldAlt, FaEnvelope, FaSearch } from "react-icons/fa";
import UserTable from "./components/UserTable";
import PendingInvitesTable from "./components/PendingInvitesTable";
import InviteUserDialog from "./components/InviteUserDialog";
import FontSizeVarsProvider from "@/components/settings/font/FontSizeVarsProvider";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { userRole } = useUserSettings();

  // Check if user can manage users
  const canManageUsers = userRole?.canManageUsers || false;
  const canInviteUsers = userRole?.canInviteUsers || false;

  // Fetch users & invites
  const refresh = async () => {
    setLoading(true);
    try {
      const [usersData, invitesData] = await Promise.all([
        fetchOrgUsers(),
        fetchInvites(),
      ]);
      setUsers(usersData);
      setInvites(invitesData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    refresh(); 
  }, []);

  // Filter users based on search and role
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter
  const availableRoles = [...new Set(users.map((user: User) => user.role))];

  // Get role display name
  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      admin: "Platform Admin",
      owner: "Organization Owner", 
      ceo: "CEO/Global Access",
      national_manager: "National Manager",
      regional_manager: "Regional Manager",
      local_manager: "Site Manager",
      employee: "Employee",
      client: "Client/Partner",
      tech_support: "Tech Support",
      read_only: "Read Only",
      custom: "Custom Role",
    };
    return roleMap[role] || role;
  };

  // User stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u: User) => u.is_active).length;
  const pendingInvites = invites.length;

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
                onClick={() => setShowInviteDialog(true)}
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
              {/* Search */}
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
              
              {/* Role Filter */}
              <div className="lg:w-64">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 transition"
                  style={{ fontSize: "var(--body)" }}
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>
                      {getRoleDisplayName(role)}
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
              <p className="text-gray-500 dark:text-gray-400"
                style={{ fontSize: "var(--body)" }}>
                Loading team members...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Users Table - Takes 2/3 width on xl screens */}
              <div className="xl:col-span-2">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                      style={{ fontSize: "var(--h3)" }}>
                      <FaUsers className="text-blue-500" />
                      Team Members ({filteredUsers.length})
                    </h3>
                  </div>
                  <UserTable users={filteredUsers} onAction={refresh} canManage={canManageUsers} />
                </div>
              </div>

              {/* Pending Invites - Takes 1/3 width on xl screens */}
              <div className="xl:col-span-1">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                      style={{ fontSize: "var(--h3)" }}>
                      <FaEnvelope className="text-orange-500" />
                      Pending Invites ({invites.length})
                    </h3>
                  </div>
                  <PendingInvitesTable invites={invites} onResend={refresh} onRevoke={refresh} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invite Dialog */}
        {showInviteDialog && (
          <InviteUserDialog 
            onInvited={() => {
              refresh();
              setShowInviteDialog(false);
            }}
            onClose={() => setShowInviteDialog(false)}
          />
        )}
      </div>
    </FontSizeVarsProvider>
  );
}

// Stats Card Component
function StatCard({ 
  icon, 
  title, 
  value, 
  subtitle 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: number; 
  subtitle: string; 
}) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-900/30 p-6">
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400"
            style={{ fontSize: "var(--small)" }}>
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white"
            style={{ fontSize: "var(--h2)" }}>
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400"
            style={{ fontSize: "var(--small)" }}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
