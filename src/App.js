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
import Planning from "./components/Planning"; // Import the new Planning component
import AdminApprove from "./components/AdminApprove";
import { AuthProvider, useAuth } from "./hooks/useAuth"; // Import AuthProvider and useAuth

const ADMIN_EMAIL = "sambangisunil12@gmail.com"; // Admin's email address

// This new ProtectedRoute component uses the useAuth hook
// to get user and loading state, replacing the old AuthGuard.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show a loading indicator while session is being checked
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If there is no user, redirect to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user is authenticated, render the requested component
  return children;
}

// A new route guard for admin-only pages
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If there is no user, or the user is not an admin, redirect to dashboard
  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// This is a helper component to manage the layout and routing logic
function AppLayout() {
  const location = useLocation();
  // Don't show Navbar or NotificationListener on login or signup page
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-[#2D0900] text-[#FFD700] flex flex-col pb-16">
      {!hideNavbar && <Navbar />}
      {!hideNavbar && <NotificationListener />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes are now wrapped with ProtectedRoute */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/contributions" element={<ProtectedRoute><Contributions /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminApprove /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
        <Route path="/sponsors" element={<ProtectedRoute><Sponsors /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/info" element={<ProtectedRoute><Info /></ProtectedRoute>} />
        <Route path="/planning" element={<AdminRoute><Planning /></AdminRoute>} />

        {/* Default and catch-all routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}


// The main App component now simply wraps the AppLayout with the AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
