import { useEffect, useState } from "react";
import axios from "axios";

export interface UserProfile {
  username: string;
  email: string;
  role: string;
  business_name: string;
  plan: string;
  joined: string;
  uploads: number;
  usage: number;
  usage_quota: number;
  days_left: number;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    axios.get("/api/profile/")
      .then((res) => { if (isMounted) setProfile(res.data); })
      .catch(() => { if (isMounted) setProfile(null); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  return { profile, loading };
}
