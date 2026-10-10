import React from "react";
import logo from "../assets/Tmlogo.jpg";

export default function PageContainer({ title, userName, children, showWelcome = false }) {
  return (
    <div
      className="rounded-[36px] w-full max-w-[380px] h-auto shadow-lg border-4 border-yellow-500 flex flex-col relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.10)",
      }}
    >
      {/* Transparent Dome and Profile */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 pt-4 z-10">
        <div className="w-full flex items-center justify-between">
          <div className="rounded-full bg-white/40 backdrop-blur-md border-2 border-yellow-400 px-6 py-2 flex-1 flex items-center justify-center shadow-md"
               style={{ minHeight: 56 }}>
            <img
              src={logo}
              alt="Team Mahodara Logo"
              className="w-12 h-13 mr-3"
              style={{ objectFit: "contain" }}
            />
            <span className="text-xl font-extrabold text-yellow-800 tracking-wide">TEAM MAHODARA</span>
          </div>
          <a
            href="/profile"
            className="ml-3 flex items-center gap-2 py-1 px-3 rounded-full bg-white/60 shadow text-[#E65100] font-semibold text-sm hover:bg-orange-100 transition-all duration-300"
            style={{ zIndex: 10 }}
          >
            <span className="text-lg">👤</span> Profile
          </a>
        </div>
      </div>
      {/* Spacer for dome */}
      <div className="pt-20" />
      {/* Header with styled background */}
      <div className="pb-2 px-6">
        <div
          className="flex justify-center items-center mb-8 mt-8"
          style={{
            background: "linear-gradient(90deg, #FFF3E0 0%, #FFE0B2 100%)",
            borderRadius: "1.5rem",
            boxShadow: "0 2px 12px 0 rgba(255,193,7,0.10)",
            padding: "0.75rem 0",
          }}
        >
          <h2
            className="text-center text-2xl font-extrabold tracking-wide"
            style={{
              color: "#E65100",
              fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
              letterSpacing: "0.05em",
              textShadow: "0 2px 8px #ffe0b2",
            }}
          >
            {title}
          </h2>
        </div>
        {showWelcome && userName && (
          <h3 className="text-center text-lg font-semibold text-yellow-800 mb-2 mt-6">
            Welcome, <span className="font-bold">{userName}</span> 👋
          </h3>
        )}
      </div>
      {/* Content */}
      <div className="flex-1" />
      {children}
    </div>
  );
}
