import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TeacherTabLogo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Book/Notebook base */}
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        
        {/* Book pages */}
        <rect
          x="5"
          y="6"
          width="14"
          height="12"
          rx="1"
          fill="currentColor"
          fillOpacity="0.05"
        />
        
        {/* Writing lines */}
        <line
          x1="7"
          y1="9"
          x2="17"
          y2="9"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        <line
          x1="7"
          y1="11"
          x2="15"
          y2="11"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        <line
          x1="7"
          y1="13"
          x2="17"
          y2="13"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        
        {/* Tab/Folder tab */}
        <path
          d="M8 2 L16 2 L18 4 L16 6 L8 6 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        />
        
        {/* Teacher's pen/pencil */}
        <line
          x1="18"
          y1="8"
          x2="21"
          y2="5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx="21"
          cy="5"
          r="1"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export default TeacherTabLogo;

