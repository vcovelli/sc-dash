"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function GristEmbed() {
  const [gristUrl, setGristUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    axios
      .get("http://192.168.1.42:8000/api/user-schema/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setGristUrl(res.data.grist_view_url);
      })
      .catch((err) => {
        console.error("Error fetching user schema:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">Loading spreadsheet...</p>;
  }

  if (!gristUrl) {
    return <p className="text-center mt-10 text-red-600">No spreadsheet available for your account.</p>;
  }

  return (
    <div className="absolute top-[64px] left-0 right-0 bottom-0 z-0 overflow-hidden">
      <iframe
        src={gristUrl}
        className="w-full h-full border-none"
        title="SupplyWise Spreadsheet"
      />
    </div>
  );
}
