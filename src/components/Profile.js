import React, { useState, useEffect } from "react";
import PageContainer from "./PageContainer";
import BackgroundWrapper from "../components/BackgroundWrapper";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState({
    name: "",
    contact: "",
    photo: "",
    email: "",
    id: "",
  });
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPhoto, setNewPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  // Get the authenticated user's ID and email from Supabase Auth
  useEffect(() => {
    async function getUser() {
      let user;
      if (supabase.auth.getUser) {
        const { data } = await supabase.auth.getUser();
        user = data?.user;
      } else {
        user = supabase.auth.user();
      }
      setUserId(user?.id);
      setProfile((prev) => ({
        ...prev,
        email: user?.email || "",
        id: user?.id || "",
      }));
    }
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
    // eslint-disable-next-line
  }, [userId]);

  // Save profile name to localStorage for use in Tasks.js
  useEffect(() => {
    if (profile.name) {
      localStorage.setItem("profileName", profile.name);
    }
  }, [profile.name]);

  async function fetchProfile() {
    if (!userId) return;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error && error.code === "PGRST116") {
      // Not found: Insert a new row for this user
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: userId, name: "", contact: "", photo: "" }]);
      if (insertError) {
        setErrorMsg("Error inserting new user: " + insertError.message);
      }
      setProfile((prev) => ({ ...prev, name: "", contact: "", photo: "" }));
      setNewName("");
      setNewContact("");
      return;
    }
    if (error) {
      setErrorMsg("Error fetching profile: " + error.message);
    }
    if (data) {
      setProfile((prev) => ({
        ...prev,
        ...data,
      }));
      setNewName(data.name || "");
      setNewContact(data.contact || "");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setUploading(true);
    setErrorMsg("");
    let photoUrl = profile.photo;

    // Handle photo upload if changed
    if (newPhoto) {
      const fileExt = newPhoto.name.split(".").pop();
      const filePath = `profile/${userId}_${Date.now()}.${fileExt}`;
      // Remove any existing file with the same path (optional, for upsert)
      await supabase.storage.from("profile-photos").remove([filePath]);
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, newPhoto, { upsert: true });

      if (uploadError) {
        setErrorMsg("Photo upload error: " + uploadError.message);
      } else {
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(filePath);
        photoUrl = publicUrlData?.publicUrl;
        if (!photoUrl) {
          setErrorMsg("Could not get public URL for uploaded photo.");
        }
      }
    }

    // Update profile in DB
    const { error } = await supabase
      .from("users")
      .update({ name: newName, contact: newContact, photo: photoUrl })
      .eq("id", userId);

    if (error) {
      setErrorMsg("Profile update error: " + error.message);
    } else {
      await fetchProfile();
      setEditing(false);
      setNewPhoto(null);
    }
    setUploading(false);
  }

  // Logout handler
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <BackgroundWrapper>
      <PageContainer title="PROFILE">
        <div
          className="flex flex-col items-center px-6 pb-8 w-full max-w-md mx-auto border-4 border-yellow-400 rounded-2xl shadow-lg"
          style={{
            background: "linear-gradient(135deg, #FFF8E1 80%, #FFE0B2 100%)",
            boxShadow: "0 4px 24px 0 rgba(255,193,7,0.10)",
          }}
        >
          <div className="mb-4 mt-6">
            <img
              src={profile.photo || "/default-profile.png"}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-yellow-400 shadow"
            />
          </div>
          {errorMsg && (
            <div className="mb-2 text-red-600 text-sm font-semibold">{errorMsg}</div>
          )}
          {editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-3 w-full max-w-xs">
              <label className="font-semibold text-yellow-800">Name</label>
              <input
                type="text"
                className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
              <label className="font-semibold text-yellow-800">Contact Number</label>
              <input
                type="text"
                className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                value={newContact}
                onChange={e => setNewContact(e.target.value)}
                required
              />
              <label className="font-semibold text-yellow-800">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                className="rounded-lg px-3 py-2 border border-yellow-400 bg-white/70 focus:outline-none text-black"
                onChange={e => setNewPhoto(e.target.files[0])}
              />
              <button
                type="submit"
                disabled={uploading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition"
              >
                {uploading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 rounded-lg transition"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              <div className="text-lg font-bold text-yellow-900">{profile.name}</div>
              <div className="text-sm text-yellow-800">Contact: {profile.contact}</div>
              <div className="text-sm text-yellow-800">Email: {profile.email}</div>
              <div className="text-xs text-yellow-700 break-all">User ID: {profile.id}</div>
              <button
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
              <button
                className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </PageContainer>
    </BackgroundWrapper>
  );
}
