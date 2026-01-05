'use client';

import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'dark' | 'mark';
  alt?: string;
}

const sizeClasses: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

const variantSrc: Record<NonNullable<LogoProps['variant']>, string> = {
  default: '/images/logo.svg',
  light: '/images/logo-light.svg',
  dark: '/images/logo-dark.svg',
  mark: '/images/Tt.svg'
};

export function TeacherTabLogo({
  className = '',
  size = 'md',
  variant = 'default',
  alt = 'TeacherTab logo'
}: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const src = variantSrc[variant] ?? variantSrc.default;

  const handleError = () => {
    console.error(`Failed to load logo: ${src}`);
    setImgError(true);
  };

  if (imgError) {
    // Fallback to default variant if the requested variant fails
    const fallbackSrc = variant === 'default' ? '/images/Tt.svg' : variantSrc.default;
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <img 
          src={fallbackSrc} 
          alt={alt} 
          className="h-full w-full object-contain"
          onError={() => {
            console.error(`Failed to load fallback logo: ${fallbackSrc}`);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img 
        src={src} 
        alt={alt} 
        className="h-full w-full object-contain"
        onError={handleError}
      />
    </div>
  );
}

export default TeacherTabLogo;

