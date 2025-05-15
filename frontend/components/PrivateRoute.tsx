"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
    } else {
      setCheckingAuth(false); // token exists, show content
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}

// This component checks if the user is authenticated by looking for a token in localStorage.
// If the token is not found, it redirects the user to the login page.
// If the token is found, it renders the children components.