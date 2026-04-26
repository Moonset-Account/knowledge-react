'use client';

import Link from 'next/link';
import { ArticleReader } from './ArticleReader';
import { ReadingProgressBar } from './ReadingProgressBar';

interface Author {
  id: string;
  name: string | null;
  email: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  tagId: string;
  tag: {
    id: string;
    name: string;
    slug: string;
  };
}

interface DocumentContentProps {
  document: {
    id: string;
    title: string;
    content: string | null;
    excerpt: string | null;
    createdAt: Date;
    updatedAt: Date;
    viewCount: number;
    author: Author | null;
    category: Category | null;
    tags: Tag[];
  };
  isAuthenticated: boolean;
}

export function DocumentContent({ document, isAuthenticated }: DocumentContentProps) {
  const readingTime = document.content ? Math.ceil(document.content.length / 300) : 0;

  return (
    <>
      <ReadingProgressBar showTime={false} />
      
      <article className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-8 md:p-12">
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {document.category && (
                <Link
                  href={`/documents?category=${document.category.slug}`}
                  className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition-colors"
                >
                  {document.category.name}
                </Link>
              )}
              {document.tags.map((dt) => (
                <Link
                  key={dt.tagId}
                  href={`/documents?tag=${dt.tag.slug}`}
                  className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full hover:bg-secondary/20 transition-colors"
                >
                  {dt.tag.name}
                </Link>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {document.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-6">
              {document.author && (
                <Link href={`/authors/${document.author.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary text-sm font-medium">
                      {document.author.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{document.author.name}</span>
                </Link>
              )}
              {readingTime > 0 && (
                <div className="flex items-center gap-1">
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
              <span>{document.viewCount} 次阅读</span>
            </div>
          </header>

          {document.excerpt && (
            <div className="mb-8 p-4 bg-primary/5 border-l-4 border-primary rounded-r-lg">
              <p className="text-text-secondary italic">{document.excerpt}</p>
            </div>
          )}

          {document.content && (
            <MarkdownContent content={document.content} />
          )}
        </div>
      </article>
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose max-w-none">
      <ArticleReader content={content} showTOC={true} />
    </div>
  );
}
