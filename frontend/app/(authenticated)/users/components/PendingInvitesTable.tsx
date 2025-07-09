"use client";

import { FC } from "react";

type PendingInvite = {
  email: string;
  role: string;
  created_at: string;
  token: string;
};

type Props = {
  invites: PendingInvite[];
  onResend: (token: string) => void;
  onRevoke: (token: string) => void;
};

const PendingInvitesTable: FC<Props> = ({ invites, onResend, onRevoke }) => {
  if (!invites?.length) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
        <h2 className="font-bold text-lg mb-2">Pending Invites</h2>
        <div className="text-gray-500 text-sm">No pending invites.</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
      <h2 className="font-bold text-lg mb-4">Pending Invites</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2">Email</th>
            <th className="text-left py-2">Role</th>
            <th className="text-left py-2">Sent</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.token} className="border-t last:border-b">
              <td className="py-2">{invite.email}</td>
              <td className="py-2 capitalize">{invite.role}</td>
              <td className="py-2 text-gray-400">
                {new Date(invite.created_at).toLocaleDateString()}
              </td>
              <td className="py-2 flex gap-2">
                <button
                  onClick={() => onResend(invite.token)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
                  title="Resend invite"
                >
                  Resend
                </button>
                <button
                  onClick={() => onRevoke(invite.token)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                  title="Revoke invite"
                >
                  Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PendingInvitesTable;
