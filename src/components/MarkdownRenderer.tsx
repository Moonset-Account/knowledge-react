'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkSlug from 'remark-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface MarkdownRendererProps {
  content: string;
  showTOC?: boolean;
  onTOCChange?: (items: TOCItem[]) => void;
}

export function MarkdownRenderer({ content, showTOC = false, onTOCChange }: MarkdownRendererProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingsRef = useRef<Set<string>>(new Set());

  const processedContent = useMemo(() => {
    const headings: TOCItem[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');
      
      if (level === 2 || level === 3) {
        headings.push({ id, text, level });
        headingsRef.current.add(id);
      }
    }

    if (onTOCChange) {
      onTOCChange(headings);
    }
    setTocItems(headings);

    return content;
  }, [content, onTOCChange]);

  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    observerRef.current = observer;

    setTimeout(() => {
      tocItems.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      observer.disconnect();
    };
  }, [tocItems]);

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <article className="prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkSlug as any]}
            rehypePlugins={[
              rehypeHighlight,
              [
                rehypeAutolinkHeadings,
                {
                  behavior: 'prepend',
                  properties: {
                    className: 'anchor',
                    ariaHidden: 'true',
                    tabIndex: -1,
                  },
                  content: {
                    type: 'text',
                    value: '#',
                  },
                },
              ] as any,
            ]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match && !className?.includes('language-');
                
                if (isInline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <div className="relative my-4">
                    {match && (
                      <div className="absolute top-0 right-0 px-3 py-1 text-xs text-text-secondary bg-background rounded-bl">
                        {match[1]}
                      </div>
                    )}
                    <pre className={`${className} overflow-x-auto rounded-lg`}>
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                );
              },
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </article>
      </div>

      {showTOC && tocItems.length > 0 && (
        <div className="hidden xl:block w-64 flex-shrink-0">
          <div className="toc-container">
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3 px-2">目录</h3>
              <nav className="space-y-1">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`toc-link level-${item.level} ${activeId === item.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(item.id);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setActiveId(item.id);
                      }
                    }}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function useTOC(content: string) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const headings: TOCItem[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');
      
      if (level === 2 || level === 3) {
        headings.push({ id, text, level });
      }
    }

    setTocItems(headings);
  }, [content]);

  return tocItems;
}
