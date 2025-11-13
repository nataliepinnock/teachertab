'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterHeadlineProps {
  className?: string;
  text?: string;
  typingSpeed?: number;
}

export function TypewriterHeadline({
  className,
  text = 'Plan. Teach. Organise.',
  typingSpeed = 90
}: TypewriterHeadlineProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (displayText === text) return;

    const timeout = setTimeout(() => {
      setDisplayText(text.slice(0, displayText.length + 1));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, text, typingSpeed]);

  return (
    <h1 className={cn('relative font-bold text-[#001b3d]', className)}>
      <span>{displayText}</span>
      <span className="ml-2 inline-block h-[1em] w-0.5 animate-pulse bg-[#fbae36]" />
    </h1>
  );
}


