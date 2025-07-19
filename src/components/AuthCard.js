import React from "react";

export default function AuthCard({ children }) {
  return (
    <div className="w-full max-w-xs bg-[#3A0D02] rounded-3xl shadow-2xl p-8 flex flex-col items-center z-10">
      {children}
    </div>
  );
}
