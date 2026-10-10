import {
  HomeIcon,
  CurrencyRupeeIcon,
  GiftIcon,
  ClipboardDocumentCheckIcon,
  PhotoIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

// Set your admin email here
const ADMIN_EMAIL = "youradmin@email.com";

const navItems = [
  { to: "/", icon: <HomeIcon className="w-6 h-6" />, label: "" },
  { to: "/expenses", icon: <CurrencyRupeeIcon className="w-6 h-6" />, label: "" },
  { to: "/contributions", icon: <GiftIcon className="w-6 h-6" />, label: "" },
  { to: "/tasks", icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />, label: "" },
  { to: "/gallery", icon: <PhotoIcon className="w-6 h-6" />, label: "" },
  { to: "/sponsors", icon: <UserGroupIcon className="w-6 h-6" />, label: "" },
  { to: "/chat", icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />, label: "" },
];

export default function BottomNavBar() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // Optional: Show admin icon if logged-in user is admin
  useEffect(() => {
    // Check localStorage for user's email (set this on login)
    const email = localStorage.getItem("userEmail");
    setIsAdmin(email === ADMIN_EMAIL);
  }, []);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-[430px] max-w-[95vw] pb-2">
      <div
        className="mx-auto flex justify-between items-center bg-white/80 rounded-2xl shadow-lg border-2 border-yellow-400 px-3 py-2"
        style={{
          backdropFilter: "blur(8px)",
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center ${
              location.pathname === item.to
                ? "text-[#E65100]"
                : "text-gray-500"
            }`}
          >
            {item.icon}
            {/* If you want to show labels, add: <span className="mt-1 text-[10px]">{item.label}</span> */}
          </Link>
        ))}
        {/* Optional: Admin icon only for admin user */}
        {isAdmin && (
          <Link
            to="/admin"
            className={`flex flex-col items-center ${
              location.pathname === "/admin"
                ? "text-[#E65100]"
                : "text-gray-500"
            }`}
            title="Admin Panel"
          >
            <Cog6ToothIcon className="w-6 h-6" />
          </Link>
        )}
      </div>
    </nav>
  );
}
