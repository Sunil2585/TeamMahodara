import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import DashboardHome from "./components/DashboardHome";
import Expenses from "./components/Expenses";
import Contributions from "./components/Contributions";
import Tasks from "./components/Tasks";
import Gallery from "./components/Gallery";
import Sponsors from "./components/Sponsors";
import Chat from "./components/Chat";
import Profile from "./components/Profile";
import Events from "./components/Events";
import Info from "./components/Info";
import Login from "./components/Login";
import Signup from "./components/Signup";
import NotificationListener from "./components/NotificationListener";
import AdminApprove from "./components/AdminApprove";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// AuthGuard component for protecting private routes
function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null; // Or a loading spinner

  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  // Don't show Navbar or NotificationListener on login or signup page
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";
  const hideNotifications = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-[#2D0900] text-[#FFD700] flex flex-col pb-16">
      {!hideNavbar && <Navbar />}
      {!hideNotifications && <NotificationListener />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardHome />
            </AuthGuard>
          }
        />
        <Route
          path="/expenses"
          element={
            <AuthGuard>
              <Expenses />
            </AuthGuard>
          }
        />
        <Route
          path="/contributions"
          element={
            <AuthGuard>
              <Contributions />
            </AuthGuard>
          }
        />
        <Route path="/admin" element={<AdminApprove />} />
        <Route
          path="/tasks"
          element={
            <AuthGuard>
              <Tasks />
            </AuthGuard>
          }
        />
        <Route
          path="/gallery"
          element={
            <AuthGuard>
              <Gallery />
            </AuthGuard>
          }
        />
        <Route
          path="/sponsors"
          element={
            <AuthGuard>
              <Sponsors />
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          }
        />
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <Chat />
            </AuthGuard>
          }
        />
        <Route
          path="/events"
          element={
            <AuthGuard>
              <Events />
            </AuthGuard>
          }
        />
        <Route
          path="/info"
          element={
            <AuthGuard>
              <Info />
            </AuthGuard>
          }
        />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
