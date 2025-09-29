"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import gsap from "gsap";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ✅ Ensure profile exists or create one
  const ensureProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, currency_pref, avatar_url")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // Insert a new profile if missing
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: "",
        currency_pref: "USD",
        avatar_url: null,
      });
      if (insertError) console.error("Insert profile error:", insertError.message);
      return;
    }

    if (data) {
      setProfile(data);
      if (data.avatar_url) {
        setAvatarPreview(`${data.avatar_url}?t=${Date.now()}`);
      }
    }
  };

  // ✅ Auth listener + load profile
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await ensureProfile(u.id);
    });

    return () => subscription.unsubscribe();
  }, []);


  const uploadAvatarToStorage = async (file) => {
    if (!user || !file) return null;
    const path = `avatars/${user.id}/avatar.png`;

    try {
      setUploading(true);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      if (publicData?.publicUrl) {
        return `${publicData.publicUrl}?t=${Date.now()}`;
      }
      return null;
    } catch (err) {
      console.error("upload avatar err:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  
  const handleSave = async () => {
    if (!user) return;

    let avatar_url = profile?.avatar_url || null;

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      const blob = await fetch(avatarPreview).then((r) => r.blob());
      avatar_url = await uploadAvatarToStorage(blob);
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        currency_pref: profile.currency_pref,
        avatar_url,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Save profile error:", error.message);
    } else {
      setModalOpen(false);
      setAvatarPreview(avatar_url);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (modalOpen) {
      gsap.fromTo(
        ".modal-content",
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [modalOpen]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md sm:max-w-lg lg:max-w-xl">
        <h2 className="text-2xl font-bold text-center">Profile</h2>

        <div className="flex text-blue-900  flex-col items-center mt-6 space-y-3">
          <img
            src={avatarPreview || "https://placehold.co/150x150?text=Avatar"}
            alt="avatar"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border"
          />
          <h3 className="text-lg font-bold">
            {profile.full_name || "Anonymous"}
          </h3>
          <p className="text-sm text-gray-500">
            Preferred Currency: {profile.currency_pref || "USD"}
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-11/12 max-w-md sm:max-w-lg">
            <h3 className="text-xl font-bold mb-4 text-center">
              Update Profile
            </h3>

            {/* Avatar Upload */}
            <div className="flex flex-col text-blue-700 items-center space-y-3">
              <img
                src={avatarPreview || "https://placehold.co/150x150?text=Avatar"}
                alt="avatar"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border"
              />
              <input type="file" onChange={handleFileChange}   accept="image/*" />
            </div>

            {/* Full Name */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2"
                value={profile.full_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
              />
            </div>

            {/* Currency Preference */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Preferred Currency
              </label>
              <select
                className="w-full border rounded-lg p-2"
                value={profile.currency_pref || "USD"}
                onChange={(e) =>
                  setProfile({ ...profile, currency_pref: e.target.value })
                }
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="NGN">NGN (₦)</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6 flex-wrap">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100 transition w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto"
              >
                {uploading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
