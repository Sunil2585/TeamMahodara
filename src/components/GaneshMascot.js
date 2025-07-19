import React from "react";
import Ganeshsvg from "../assets/jk.png";

export default function GaneshMascot() {
  return (
    <div className="flex justify-center  ">
      <img
        src={Ganeshsvg}
        alt="Ganesh Mascot"
        className="w-36 h-46 #2d0900 rounded-full shadow-lg"
        draggable={false}
      />
    </div>
  );
}
