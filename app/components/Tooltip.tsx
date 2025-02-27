"use client";

import React, { useState } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "right" | "bottom" | "left";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  // Position classes based on the position prop
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={showTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md shadow-sm whitespace-nowrap ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute ${
              position === "top"
                ? "top-full left-1/2 transform -translate-x-1/2 border-t-gray-900"
                : position === "right"
                ? "right-full top-1/2 transform -translate-y-1/2 border-r-gray-900"
                : position === "bottom"
                ? "bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900"
                : "left-full top-1/2 transform -translate-y-1/2 border-l-gray-900"
            } ${
              position === "top" || position === "bottom"
                ? "border-x-transparent border-x-8 border-t-8"
                : "border-y-transparent border-y-8 border-r-8"
            }`}
          />
        </div>
      )}
    </div>
  );
} 