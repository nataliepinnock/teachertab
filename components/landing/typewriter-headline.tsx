'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterHeadlineProps {
  className?: string;
  words?: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  deleteSpeed?: number;
}

const DEFAULT_WORDS = ['Plan.', 'Teach.', 'Simplify.'];

export function TypewriterHeadline({
  className,
  words = DEFAULT_WORDS,
  typingSpeed = 120,
  deleteSpeed = 60,
  pauseDuration = 900
}: TypewriterHeadlineProps) {
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex % words.length];

    if (!isDeleting && displayText === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), pauseDuration);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      const nextLength = displayText.length + (isDeleting ? -1 : 1);
      setDisplayText(currentWord.slice(0, nextLength));
    }, isDeleting ? deleteSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, pauseDuration, typingSpeed, deleteSpeed, wordIndex, words]);

  return (
    <h1 className={cn('relative font-bold text-[#001b3d]', className)}>
      <span>{displayText}</span>
      <span className="ml-2 inline-block h-[1em] w-0.5 animate-pulse bg-[#fbae36]" />
    </h1>
  );
}


