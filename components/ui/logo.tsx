'use client';

import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'dark' | 'mark' | 'inverse';
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
  mark: '/images/Tt.svg',
  inverse: '/images/logo-inverse.svg'
};

export function TeacherTabLogo({
  className = '',
  size = 'md',
  variant = 'default',
  alt = 'TeacherTab logo'
}: LogoProps) {
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const requestedSrc = variantSrc[variant] ?? variantSrc.default;

  useEffect(() => {
    // Preload the image to check if it exists
    const img = new Image();
    img.onload = () => {
      setImgSrc(requestedSrc);
      setImgError(false);
    };
    img.onerror = () => {
      console.error(`Failed to load logo: ${requestedSrc}`);
      // Fallback to default variant if the requested variant fails
      const fallbackSrc = variant === 'default' ? '/images/Tt.svg' : variantSrc.default;
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        setImgSrc(fallbackSrc);
        setImgError(false);
      };
      fallbackImg.onerror = () => {
        console.error(`Failed to load fallback logo: ${fallbackSrc}`);
        setImgError(true);
      };
      fallbackImg.src = fallbackSrc;
    };
    img.src = requestedSrc;
  }, [variant, requestedSrc]);

  if (imgError) {
    // Show text fallback if all images fail
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-gray-200 rounded`}>
        <span className="text-xs font-bold text-gray-600">TT</span>
      </div>
    );
  }

  if (!imgSrc) {
    // Show loading state
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 animate-pulse rounded`} />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img 
        src={imgSrc} 
        alt={alt} 
        className="h-full w-full object-contain"
        loading="eager"
      />
    </div>
  );
}

export default TeacherTabLogo;

