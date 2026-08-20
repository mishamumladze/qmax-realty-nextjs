"use client";

import React, { useState, useEffect } from "react";

interface CheckboxProps {
  label?: string;
  status?: "enabled" | "checked" | "disabled";
  onChange?: (checked: boolean) => void;
}

export default function Checkbox({
  label,
  status = "enabled",
  onChange,
}: CheckboxProps) {
  const isDisabled = status === "disabled";
  const [isChecked, setIsChecked] = useState(status === "checked");

  // Keep state synced if parent updates status prop
  useEffect(() => {
    setIsChecked(status === "checked");
  }, [status]);

  const toggle = () => {
    if (isDisabled) return;
    const nextState = !isChecked;
    setIsChecked(nextState);
    onChange?.(nextState);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      disabled={isDisabled}
      onClick={toggle}
      className={`group inline-flex items-center gap-2 select-none text-left focus:outline-none ${
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {/* Visual Checkbox Box Container */}
      <div className="relative flex items-center justify-center p-1">
        {/* Hover ripple background */}
        <div className="absolute -inset-1.5 rounded-full bg-[#223254]/[0.03] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className={`relative z-10 fill-none stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round] transition-colors duration-200 ${
            isChecked
              ? "stroke-[#4285f4]"
              : "stroke-[#c8ccd4] group-hover:stroke-[#4285f4]"
          }`}
        >
          {/* Outer Box Path */}
          <path
            d="M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z"
            style={{
              strokeDasharray: 60,
              strokeDashoffset: isChecked ? 60 : 0,
              transition: "stroke-dashoffset 0.3s linear",
              transitionDelay: isChecked ? "0s" : "0.15s",
            }}
          />

          {/* Inner Checkmark Polyline */}
          <polyline
            points="1 9 7 14 15 4"
            style={{
              strokeDasharray: 22,
              strokeDashoffset: isChecked ? 42 : 66,
              transition: "stroke-dashoffset 0.2s linear",
              transitionDelay: isChecked ? "0.15s" : "0s",
            }}
          />
        </svg>
      </div>

      {label && <span className="text-sm text-gray-700">{label}</span>}
    </button>
  );
}