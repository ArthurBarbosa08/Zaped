import React from "react";
import { Zap } from "lucide-react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  className = "",
  iconClassName = "",
  textClassName = "",
  showText = true,
  size = "md",
}: LogoProps) {
  const sizes = {
    sm: {
      iconContainer: "p-1.5 rounded-lg",
      iconSize: 16,
      textSize: "text-lg",
    },
    md: {
      iconContainer: "p-2 rounded-xl",
      iconSize: 24,
      textSize: "text-2xl",
    },
    lg: {
      iconContainer: "p-3 rounded-2xl",
      iconSize: 36,
      textSize: "text-4xl",
    },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center bg-gradient-to-tr from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/20 ${currentSize.iconContainer} ${iconClassName}`}
      >
        <Zap
          size={currentSize.iconSize}
          className="fill-current text-white animate-pulse-slow"
        />
        {/* Subtle glow effect */}
        <div className="absolute inset-0 -z-10 rounded-inherit bg-primary/30 blur-md" />
      </div>
      {showText && (
        <span
          className={`font-black tracking-tight text-foreground ${currentSize.textSize} ${textClassName}`}
        >
          Zap<span className="text-primary bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">ed</span>
        </span>
      )}
    </div>
  );
}
