import React from 'react';

export default function Logo({ className = "h-10 w-auto", showText = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 44" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="EntreNós">
        <defs>
          <linearGradient id="lg-purple" x1="0" y1="44" x2="24" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7559E6" />
            <stop offset="1" stopColor="#9B7CF0" />
          </linearGradient>
          <linearGradient id="lg-coral" x1="48" y1="44" x2="24" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF9D8E" />
            <stop offset="1" stopColor="#FFB5A8" />
          </linearGradient>
        </defs>
        {/* Left bubble */}
        <path d="M6 16c0-5.5 4.5-10 10-10h4c5.5 0 10 4.5 10 10v10c0 2.2-1.8 4-4 4H16c-5.5 0-10-4.5-10-10V16z" fill="url(#lg-purple)" />
        {/* Right bubble */}
        <path d="M42 16c0-5.5-4.5-10-10-10h-4c-5.5 0-10 4.5-10 10v10c0 2.2 1.8 4 4 4h10c5.5 0 10-4.5 10-10V16z" fill="url(#lg-coral)" />
        {/* Left head */}
        <circle cx="14" cy="9" r="4.5" fill="url(#lg-purple)" />
        {/* Right head */}
        <circle cx="34" cy="9" r="4.5" fill="url(#lg-coral)" />
      </svg>
      {showText && (
        <span className="font-heading font-bold text-xl tracking-tight" style={{ color: 'hsl(240 25% 18%)' }}>
          Entre<span style={{ color: 'hsl(258 70% 56%)' }}>Nós</span>
        </span>
      )}
    </div>
  );
}
