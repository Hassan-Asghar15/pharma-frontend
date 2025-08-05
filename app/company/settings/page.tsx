"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
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
      setProfilePic(data.user.profilePic);
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
      setMessage(data.message);
    } catch (error) {
      setMessage("Password change failed");
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>

      {message && <p className="mb-4 text-sm text-yellow-400">{message}</p>}

      <form onSubmit={handleProfileUpdate} className="bg-gray-800 p-6 rounded mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Edit Profile</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewProfilePic(e.target.files?.[0] || null)}
            className="text-sm text-gray-300"
          />
          {profilePic && (
            <img
              src={profilePic}
              alt="Current Profile"
              className="w-20 h-20 mt-2 rounded-full object-cover border border-gray-400"
            />
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Save Changes
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="bg-gray-800 p-6 rounded">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">Current Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">New Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          Change Password
        </button>
      </form>
    </div>
  );
}
