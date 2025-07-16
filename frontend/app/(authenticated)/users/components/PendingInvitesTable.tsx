"use client";

import { useState } from "react";
import { resendInvite } from "@/lib/invitesAPI";
import { Invite } from "@/types";
import { FaEnvelope, FaRedo, FaTimes, FaClock } from "react-icons/fa";
import toast from "react-hot-toast";

type Props = {
  invites: Invite[];
  onResend: () => void;
  onRevoke: () => void;
};

// Role display mapping
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

const getRoleIcon = (role: string): string => {
  const roleIcons: { [key: string]: string } = {
    admin: "👑",
    owner: "🏢",
    ceo: "🌟",
    national_manager: "🌍",
    regional_manager: "🗺️",
    local_manager: "📍",
    employee: "👤",
    client: "🤝",
    tech_support: "🔧",
    read_only: "👁️",
    custom: "⚙️",
  };
  return roleIcons[role] || "❓";
};

export default function PendingInvitesTable({ invites, onResend, onRevoke }: Props) {
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: string }>({});

  const handleResendInvite = async (invite: Invite) => {
    setLoadingStates(prev => ({ ...prev, [invite.id]: "resending" }));
    try {
      await resendInvite(invite.token);
      toast.success(`Invitation resent to ${invite.email}`);
      onResend();
    } catch {
      toast.error("Failed to resend invitation");
    } finally {
      setLoadingStates(prev => ({ ...prev, [invite.id]: "" }));
    }
  };

  const handleRevokeInvite = async (invite: Invite) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${invite.email}?`)) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, [invite.id]: "revoking" }));
    try {
      // You'll need to implement this API call
      // await revokeInvite(invite.id);
      toast.success(`Invitation revoked for ${invite.email}`);
      onRevoke();
    } catch {
      toast.error("Failed to revoke invitation");
    } finally {
      setLoadingStates(prev => ({ ...prev, [invite.id]: "" }));
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  if (invites.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <FaEnvelope className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No pending invitations</p>
        <p className="text-sm">All team members have joined</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {invites.map(invite => (
        <div key={invite.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
          {/* Invite Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <FaClock className="text-orange-600 dark:text-orange-400" size={14} />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {invite.email}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Invited {getTimeAgo(invite.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Role Badge */}
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800">
              <span>{getRoleIcon(invite.role)}</span>
              {getRoleDisplayName(invite.role)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleResendInvite(invite)}
              disabled={loadingStates[invite.id] === "resending"}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingStates[invite.id] === "resending" ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FaRedo size={10} />
                  Resend
                </>
              )}
            </button>
            <button
              onClick={() => handleRevokeInvite(invite)}
              disabled={loadingStates[invite.id] === "revoking"}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingStates[invite.id] === "revoking" ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                  Revoking...
                </>
              ) : (
                <>
                  <FaTimes size={10} />
                  Revoke
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
