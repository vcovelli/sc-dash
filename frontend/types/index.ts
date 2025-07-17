export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  date_joined: string;
  is_active: boolean;
  is_pending?: boolean;
  is_suspended?: boolean;
  business_name?: string;
  plan?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  usage?: number;
  usage_quota?: number;
  days_left?: number;
  last_login?: string | null;
  total_files?: number;
}

export interface Invite {
  id: number;
  email: string;
  role: string;
  created_at: string;
  token: string;
  accepted: boolean;
  invited_by?: string;
}
