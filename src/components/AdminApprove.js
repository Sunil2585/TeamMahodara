import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ADMIN_EMAIL = "sambangisunil12@gmail.com"; // Change to your admin email

export default function AdminApprove() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function checkAdminAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        setErrorMsg("Access denied. You are not the admin.");
        setLoading(false);
        return;
      }
      setUserEmail(user.email);
      fetchPending();
    }
    checkAdminAndFetch();
    // eslint-disable-next-line
  }, []);

  async function fetchPending() {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, status")
      .eq("status", "pending");
    if (error) setErrorMsg(error.message);
    else setPendingUsers(data || []);
    setLoading(false);
  }

  async function approveUser(id) {
    const { error } = await supabase
      .from("users")
      .update({ status: "approved" })
      .eq("id", id);
    if (error) alert(error.message);
    else setPendingUsers(prev => prev.filter(u => u.id !== id));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-8">
      <h2 className="text-2xl font-bold mb-4 text-yellow-900">Admin Approval Panel</h2>
      {errorMsg && <div className="text-red-600 mb-4">{errorMsg}</div>}
      {userEmail && <div className="mb-4 text-sm text-gray-700">Logged in as: {userEmail}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="w-full max-w-md">
          {pendingUsers.length === 0 ? (
            <div className="text-gray-500">No users pending approval.</div>
          ) : (
            <ul className="space-y-3">
              {pendingUsers.map(user => (
                <li key={user.id} className="flex justify-between items-center bg-white rounded p-3 shadow">
                  <div>
                    <div className="font-semibold">{user.name || "Unnamed"}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                  </div>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => approveUser(user.id)}
                  >
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
