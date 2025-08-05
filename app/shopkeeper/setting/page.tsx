"use client";

import { useEffect, useState } from "react";

// ✅ Best practice: Rename the component for clarity
export default function DistributorSettingsPage() {
  // All state variables are the same
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ NO CHANGES NEEDED to any of the logic. All these functions will work
  // correctly for the logged-in distributor.

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/users/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setName(data.name);
      setEmail(data.email);
      setProfilePic(data.profilePic);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    if (newProfilePic) formData.append("profilePic", newProfilePic);

    try {
      const res = await fetch("http://localhost:5001/api/users/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      setMessage(data.message);
      // Re-fetch profile to get the potentially updated image URL
      fetchProfile(); 
    } catch (error) {
      setMessage("Profile update failed");
      console.error(error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Password change failed');
      }
      setMessage(data.message);
      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      setMessage(error.message || "Password change failed");
      console.error(error);
    }
  };

  // ✅ The entire JSX is identical. The design and theme are preserved.
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>

      {message && <p className="mb-4 text-sm text-green-500">{message}</p>}

      <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Edit Profile</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewProfilePic(e.target.files?.[0] || null)}
            className="text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          />
          {profilePic && (
            <img
              src={profilePic}
              alt="Current Profile"
              className="w-24 h-24 mt-4 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-sm"
            />
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Save Changes
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Change Password</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Change Password
        </button>
      </form>
    </div>
  );
}