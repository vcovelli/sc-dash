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

    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/auth/me/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (isMounted) setProfile(res.data);
      } catch (err: any) {
        console.error("Profile fetch error:", err.response?.data || err.message);
        if (isMounted) {
          setProfile(null);
          // Clear invalid tokens
          if (err.response?.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  return { profile, loading };
}
