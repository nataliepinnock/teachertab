import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dark' | 'light';
}

export function TeacherTabLogo({ className = '', size = 'md', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const logoSrc = variant === 'dark' 
    ? '/images/logo-dark.svg' 
    : variant === 'light' 
    ? '/images/logo-light.svg' 
    : '/images/logo.svg';

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img 
        src={logoSrc} 
        alt="TeacherTab Logo" 
        className="w-full h-full"
      />
    </div>
  );
}

export default TeacherTabLogo;

