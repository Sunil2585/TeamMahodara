import React from "react";
import Ganseshback from "../assets/hjsk.png";

export default function BackgroundWrapper({ children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#FFF8E1] p-2 sm:p-4 bg-fixed bg-cover bg-center"
      style={{
        backgroundImage: `url(${Ganseshback})`,
        backgroundRepeat: "no-repeat",
      }}
    >
      {children}
    </div>
  );
}
