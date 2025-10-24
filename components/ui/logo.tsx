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
      <img 
        src="/images/Tt.svg" 
        alt="TeacherTab Logo" 
        className="w-full h-full"
      />
    </div>
  );
}

export default TeacherTabLogo;

