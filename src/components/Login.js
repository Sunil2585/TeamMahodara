import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import GaneshMascot from "./GaneshMascot";
import { ReactComponent as GoogleIcon } from "../assets/google.svg";
import AuthCard from "./AuthCard";

export default function Login() {
  const navigate = useNavigate();
  const { loading, errorMsg, logInWithEmail, signInWithGoogle, clearMessages } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await logInWithEmail({ email, password });
    if (!error) {
      // On successful email login, navigate to the dashboard
      navigate("/dashboard");
    }
  };

  // It's good practice to have a dedicated handler for each action.
  const handleGoogleSignIn = async () => {
    // The useAuth hook should handle setting loading/error states.
    // This function call will trigger the OAuth redirect flow.
    await signInWithGoogle({
      redirectTo: `${window.location.origin}/dashboard`,
    });
    // After a successful call, the user is redirected to Google.
    // When they return, an auth state listener should route them to the dashboard.
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8E1] via-[#FFE0B2] to-[#FFD700] px-4">
      <GaneshMascot />
      <h1 className="text-4xl font-extrabold mb-8 text-center text-[#E65100]">
        TEAM MAHODARA
      </h1>
      <AuthCard>
        {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            required
            onFocus={clearMessages}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-3 border-2 rounded-xl"
            autoComplete="email"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              required
              onFocus={clearMessages}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-4 p-3 border-2 rounded-xl"
              autoComplete="current-password"
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
            {loading ? "Processing..." : "Login"}
          </button>
        </form>
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 mb-2 bg-white rounded-xl flex items-center justify-center"
        >
          <GoogleIcon className="w-6 h-6 mr-2" />
          Sign in with Google
        </button>
        <div className="text-center">
          {/* Use Link component for client-side routing without a page refresh */}
          <Link to="/signup" className="text-[#E65100] underline">
            New user? Sign Up
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}