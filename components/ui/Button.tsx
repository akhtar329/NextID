"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean; // ✅ Add this
};

export default function Button({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false, // ✅ Default false
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled} // ✅ Pass to native button
      className={`bg-black text-white px-4 py-2 rounded-md text-sm hover:opacity-90 transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
      } ${className}`}
    >
      {children}
    </button>
  );
}
