"use client";

import { memo, useState, useEffect } from "react";

// ============================================
// TYPES
// ============================================

interface UserCursorProps {
  x: number;
  y: number;
  name: string;
  color: string;
}

// ============================================
// COMPONENT — memoized to avoid re-render on every cursor update from other users
// Skills: rerender-memo
// ============================================

export const UserCursor = memo(function UserCursor({
  x,
  y,
  name,
  color,
}: UserCursorProps) {
  const [opacity, setOpacity] = useState(1);

  // Fade out after 2s of no prop changes
  useEffect(() => {
    setOpacity(1);
    const timer = setTimeout(() => {
      setOpacity(0);
    }, 2000);
    return () => clearTimeout(timer);
  }, [x, y]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
        zIndex: 50,
        transform: "translate(-2px, -2px)",
      }}
      aria-hidden="true"
    >
      {/* SVG arrow pointer icon */}
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 0L0 16L5 11L9 19L11 18L7 10L13 10L0 0Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* Name label */}
      <div
        style={{
          backgroundColor: color,
          marginTop: 2,
          marginLeft: 4,
        }}
        className="px-2 py-0.5 rounded text-white text-xs font-medium whitespace-nowrap shadow-sm"
      >
        {name}
      </div>
    </div>
  );
});
