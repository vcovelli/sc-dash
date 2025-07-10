import axios from "axios";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://supplywise.ai/api/accounts";

// Get all org users
export async function fetchOrgUsers() {
  const token = localStorage.getItem("access_token");
  const res = await axios.get(`${API}/api/accounts/org/users/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Get pending invites
export async function fetchInvites() {
  const token = localStorage.getItem("access_token");
  const res = await axios.get(`${API}/invite/pending/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Invite a user
export async function inviteUser(email: string, role: string) {
  const token = localStorage.getItem("access_token");
  const res = await axios.post(`${API}/invite/send/`, { email, role }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Resend invite
export async function resendInvite(tokenStr: string) {
  const token = localStorage.getItem("access_token");
  const res = await axios.post(`${API}/invite/resend/`, { token: tokenStr }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Delete user
export async function deleteUser(userId: string) {
  const token = localStorage.getItem("access_token");
  const res = await axios.delete(`${API}/org/users/${userId}/delete/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Update user role
export async function updateUserRole(userId: string, role: string) {
  const token = localStorage.getItem("access_token");
  const res = await axios.patch(`${API}/org/users/${userId}/`, { role }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
