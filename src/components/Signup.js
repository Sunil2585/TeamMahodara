// src/components/Signup.jsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import GaneshMascot from "./GaneshMascot";
import { ReactComponent as GoogleIcon } from "../assets/google.svg";
import AuthCard from "./AuthCard";


export default function Signup() {
  const { loading, errorMsg, successMsg, signUpWithEmail, signInWithGoogle, clearMessages } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signUpWithEmail({ email, password });
  };

  const handleGoogleSignUp = async () => {
    await signInWithGoogle({
      redirectTo: `${window.location.origin}/dashboard`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8E1] via-[#FFE0B2] to-[#FFD700] px-4">
      <GaneshMascot />
      <h1 className="text-4xl font-extrabold mb-8 text-center text-[#E65100]">
        TEAM MAHODARA
      </h1>
      <AuthCard>
        {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
        {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onFocus={clearMessages}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-3 border-2 rounded-xl"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              required
              onFocus={clearMessages}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 p-3 border-2 rounded-xl"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-3 text-xl"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mb-4 bg-gradient-to-r from-[#FFA500] to-[#FFD700] rounded-xl font-bold"
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>
        <button
          onClick={handleGoogleSignUp}
          className="w-full py-3 mb-2 bg-white rounded-xl flex items-center justify-center"
        >
          <GoogleIcon className="w-6 h-6 mr-2" />
          Sign up with Google
        </button>
        <div className="text-center">
          <a href="/login" className="text-[#E65100] underline">
            Already have an account? Login
          </a>
        </div>
      </AuthCard>
    </div>
  );
}
