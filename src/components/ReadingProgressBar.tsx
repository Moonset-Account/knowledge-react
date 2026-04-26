'use client';

import { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  showTime?: boolean;
  contentLength?: number;
}

export function ReadingProgressBar({ showTime = false, contentLength = 0 }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  const readingTime = contentLength > 0 ? Math.ceil(contentLength / 300) : 0;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(progressPercent, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div
        className="reading-progress-bar"
        style={{ width: `${progress}%` }}
      />
      {showTime && readingTime > 0 && (
        <div className="fixed top-0 right-4 z-50 mt-4">
          <div className="bg-surface border border-border rounded-full px-3 py-1 text-xs text-text-secondary shadow-sm">
            预计阅读 {readingTime} 分钟
          </div>
        </div>
      )}
    </>
  );
}
