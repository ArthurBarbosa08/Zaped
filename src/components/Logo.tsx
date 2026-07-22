import React from "react";

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
      iconSize: 24,
      textSize: "text-lg",
    },
    md: {
      iconSize: 40,
      textSize: "text-2xl",
    },
    lg: {
      iconSize: 64,
      textSize: "text-4xl",
    },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src="/favicon.ico"
        alt="Zaped"
        style={{ width: currentSize.iconSize, height: currentSize.iconSize }}
        className={`object-contain ${iconClassName}`}
      />
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
