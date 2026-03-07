import React from 'react';

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className = "w-10 h-10" }: AppLogoProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 400 400" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="50" y="50" width="300" height="300" rx="60" fill="#1E40AF" />
      
      {/* The Letter B Profile */}
      <path 
        d="M130 110H200C240 110 260 130 250 160C265 170 270 200 250 240C230 270 200 280 160 280H130V110Z" 
        fill="white" 
      />
      {/* Top Hole of B */}
      <path 
        d="M165 140H195C215 140 220 150 215 165C210 175 200 180 180 180H165V140Z" 
        fill="#1E40AF" 
      />
      {/* Bottom Hole of B */}
      <path 
        d="M165 205H200C215 205 220 215 210 235C200 245 190 250 175 250H165V205Z" 
        fill="#1E40AF" 
      />

      {/* Lightning Cutout Mask (Blue) */}
      <path 
        d="M50 310L170 160L190 190L310 90" 
        fill="none" 
        stroke="#1E40AF" 
        strokeWidth="50" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* White Lightning Bold */}
      <path 
        d="M50 310L170 160L190 190L310 90" 
        fill="none" 
        stroke="white" 
        strokeWidth="30" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
