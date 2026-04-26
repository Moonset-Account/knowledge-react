'use client';

import { useEffect, useRef, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ReadingProgressBar } from './ReadingProgressBar';

interface ArticleReaderProps {
  content: string;
  showTOC?: boolean;
}

export function ArticleReader({ content, showTOC = true }: ArticleReaderProps) {
  const [showProgress, setShowProgress] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const readingTime = content ? Math.ceil(content.length / 300) : 0;

  useEffect(() => {
    setShowProgress(true);
  }, []);

  return (
    <>
      {showProgress && (
        <ReadingProgressBar showTime={false} />
      )}
      
      {readingTime > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>预计阅读 {readingTime} 分钟</span>
        </div>
      )}

      <div ref={contentRef}>
        <MarkdownRenderer content={content} showTOC={showTOC} />
      </div>
    </>
  );
}
