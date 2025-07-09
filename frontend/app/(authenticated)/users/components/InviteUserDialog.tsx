// InviteUserModal.tsx
import { useState } from "react";
import { inviteUser } from "@/lib/invitesAPI";
import toast from "react-hot-toast";

export default function InviteUserModal({ onInvited }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    setLoading(true);
    try {
      await inviteUser(email, role);
      toast.success("Invitation sent!");
      onInvited();
      setOpen(false);
      setEmail("");
    } catch (e: unknown) {
      const error = e as Error;
      toast.error(error?.message || "Failed to send invite");
    }
    setLoading(false);
  };

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + Invite User
      </button>
      {open && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2 className="text-xl font-bold">Invite Team Member</h2>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="input" />
            <select value={role} onChange={e => setRole(e.target.value)} className="input">
              <option value="client">Client</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              {/* etc */}
            </select>
            <button className="btn-primary" disabled={loading} onClick={handleInvite}>Send Invite</button>
            <button className="btn-link" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
