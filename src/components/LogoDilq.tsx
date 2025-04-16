
import React from "react";

interface LogoDilqProps {
  className?: string;
}

export function LogoDilq({ className }: LogoDilqProps) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="8" fill="url(#paint0_linear)" />
      <path
        d="M14 16H22C24.2091 16 26 17.7909 26 20V28C26 30.2091 24.2091 32 22 32H14V16Z"
        fill="white"
      />
      <path
        d="M30 16H34V32H30V16Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="paint0_linear"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
