import React, { useState } from "react";
import AuthCard from "./AuthCard";
import GaneshMascot from "./GaneshMascot";
import { supabase } from "../supabaseClient";
import { ReactComponent as GoogleIcon } from "../assets/google.svg";

async function ensureUserInUsersTable() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!data) {
      await supabase.from("users").insert([
        {
          id: user.id,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Unnamed",
          photo: user.user_metadata?.avatar_url || "",
          status: "pending", // New users are pending by default
        },
      ]);
    }
    localStorage.setItem(
      "profileName",
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "Unnamed"
    );
  }
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else {
      await ensureUserInUsersTable();
      setSuccessMsg("Signup successful! Waiting for admin approval. Please check your email for verification link.");
    }
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8E1] via-[#FFE0B2] to-[#FFD700] overflow-hidden px-2">
      <GaneshMascot />
      <h1
        className="text-4xl font-extrabold mb-8 tracking-wider text-center z-10"
        style={{
          color: "#E65100",
          fontWeight: 900,
          letterSpacing: "0.08em",
          fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
          textShadow: "0 2px 12px #fff8e1, 0 4px 24px #e65100",
          animation: "popIn 1.2s cubic-bezier(0.4,0,0.2,1) both"
        }}
      >
        TEAM MAHODARA
      </h1>
      <AuthCard>
        {errorMsg && (
          <div className="mb-2 text-red-600 text-sm font-semibold">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="mb-2 text-green-600 text-sm font-semibold">{successMsg}</div>
        )}
        <form className="w-full" onSubmit={handleEmailSignup}>
          <input
            type="email"
            placeholder="Email"
            className="block w-full mb-4 px-4 py-3 rounded-xl bg-[#FFF8E1] text-[#E65100] placeholder-[#FFA500] border-2 border-yellow-400 focus:ring-2 focus:ring-[#FFA500] text-lg transition-all duration-300"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="block w-full mb-4 px-4 py-3 rounded-xl bg-[#FFF8E1] text-[#E65100] placeholder-[#FFA500] border-2 border-yellow-400 focus:ring-2 focus:ring-[#FFA500] text-lg transition-all duration-300"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E65100] text-lg focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <button
            type="submit"
            className="w-full mb-2 py-3 rounded-xl bg-gradient-to-r from-[#FFA500] to-[#FFD700] text-[#2D0900] font-bold text-lg shadow-lg hover:from-[#FFD700] hover:to-[#FFA500] transition-transform duration-300 hover:scale-105"
            disabled={loading}
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full mb-2 py-3 rounded-xl bg-white text-[#2D0900] font-bold text-lg shadow-lg flex items-center justify-center hover:bg-[#FFD700] transition-transform duration-300 hover:scale-105"
        >
          <GoogleIcon className="w-6 h-6 mr-2" />
          Sign up with Google
        </button>
        <div className="text-center mt-4">
          <a
            href="/login"
            className="text-[#E65100] font-semibold underline text-base"
          >
            Already have an account? Login
          </a>
        </div>
      </AuthCard>
    </div>
  );
}
