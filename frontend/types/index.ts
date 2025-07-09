export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  date_joined: string;
  is_active: boolean;
  // etc.
}

export interface Invite {
  id: number;
  email: string;
  role: string;
  created_at: string;
  token: string;
  accepted: boolean;
}
