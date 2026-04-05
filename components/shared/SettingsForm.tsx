"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface Props {
  user: {
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  showDangerZone: boolean;
}

export default function SettingsForm({ user, showDangerZone }: Props) {
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });

    const data = await res.json();
    setProfileLoading(false);

    if (!data.success) {
      setProfileError(data.error);
    } else {
      setProfileSuccess("Profile updated successfully.");
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    const res = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });

    const data = await res.json();
    setPasswordLoading(false);

    if (!data.success) {
      setPasswordError(data.error);
    } else {
      setPasswordSuccess("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    setDeleteLoading(true);

    const res = await fetch("/api/settings/delete-account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });

    const data = await res.json();
    setDeleteLoading(false);

    if (!data.success) {
      setDeleteError(data.error);
      return;
    }

    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Profile</h2>
        <p className="text-sm text-gray-400 mb-6">Update your name and phone number.</p>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={profileForm.phone}
              onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+254 700 000 000"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
          </div>

          {profileError && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{profileError}</p>
          )}
          {profileSuccess && (
            <p className="text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg">{profileSuccess}</p>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            {profileLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Change Password</h2>
        <p className="text-sm text-gray-400 mb-6">Use a strong password of at least 6 characters.</p>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
              required
            />
          </div>

          {passwordError && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-600 bg-green-50 px-4 py-2.5 rounded-lg">{passwordSuccess}</p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      {showDangerZone && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 sm:p-8">
          <h2 className="text-base font-semibold text-red-700 mb-1">Danger Zone</h2>
          <p className="text-sm text-gray-400 mb-6">
            Deleting your account is permanent and cannot be undone. All your data will be deactivated.
          </p>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-red-700">
                Enter your password to confirm account deletion:
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-2.5 rounded-lg border border-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
              {deleteError && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deletePassword}
                  className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}