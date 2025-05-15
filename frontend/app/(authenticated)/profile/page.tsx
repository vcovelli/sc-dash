"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState({ name: "VC", email: "vc@example.com", joined: "May 2024", plan: "Pro" });

  useEffect(() => {
    // 🔐 Normally you'd fetch user data from a backend here
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">👤 User Profile</h2>

      <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
            {user.name[0]}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500 text-sm">Plan</p>
          <p className="text-lg font-bold text-blue-600">{user.plan}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500 text-sm">Joined</p>
          <p className="text-lg font-bold">{user.joined}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-gray-500 text-sm">Uploads</p>
          <p className="text-lg font-bold">38</p> {/* Replace with actual count if you have it */}
        </div>
      </div>
    </div>
  );
}
