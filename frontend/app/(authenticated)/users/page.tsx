"use client";

import { useState, useEffect } from "react";
import { fetchOrgUsers, fetchInvites } from "@/lib/invitesAPI";
import { User, Invite } from "@/types";
// Import your own components:
import UserTable from "./components/UserTable";
import PendingInvitesTable from "./components/PendingInvitesTable";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users & invites
  const refresh = async () => {
    setLoading(true);
    setUsers(await fetchOrgUsers());
    setInvites(await fetchInvites());
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <section className="max-w-5xl mx-auto pt-10">
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Team Members</h1>
        {/* You could place an Invite button or dialog here */}
        {/* <InviteUserDialog onInvite={refresh} /> */}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading team...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <UserTable users={users} onAction={refresh} />
          </div>
          <div>
            <PendingInvitesTable invites={invites} onResend={refresh} onRevoke={refresh} />
          </div>
        </div>
      )}
    </section>
  );
}
