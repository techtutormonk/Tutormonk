import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

// Same logo, same look on desktop and mobile. Sits on a white rounded card so it
// stays readable on the dark site background. Height comes from className (e.g. h-11).
export const Logo: React.FC<LogoProps> = ({ className = 'h-14', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex shrink-0 items-center cursor-pointer select-none transition-transform active:scale-95 rounded-lg bg-white p-1 shadow-sm ${className}`}
      title="Tutor Monk - Brilliance Unlocked"
    >
      <img src="/logo.png" alt="Tutor Monk Logo" className="h-full w-auto max-w-none shrink-0 object-contain" draggable={false} />
    </div>
  );
};
