'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate, truncateText } from '@/lib/utils';
import { Suspense } from 'react';

interface Document {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  category: { name: string; slug: string } | null;
  tags: { tag: { name: string; slug: string } }[];
  author: { name: string } | null;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const popularSearches = ['React', 'Next.js', 'Prisma', 'TypeScript', '教程'];

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    setError('');

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.documents || []);
      } else {
        const err = await response.json();
        setError(err.error || '搜索失败');
      }
    } catch (error) {
      console.error('搜索错误:', error);
      setError('网络错误，请稍后重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      performSearch(trimmedQuery);
    }
  };

  const handleQuickSearch = (keyword: string) => {
    setQuery(keyword);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    performSearch(keyword);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-text-primary mb-4">搜索文章</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词搜索文章（支持标题、内容、分类、标签）"
              className="w-full px-6 py-4 pr-16 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-surface text-lg"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                '搜索'
              )}
            </button>
          </div>
        </form>

        {!searched && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-text-secondary">热门搜索：</span>
            {popularSearches.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleQuickSearch(keyword)}
                className="px-3 py-1.5 bg-background border border-border rounded-full text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger">
          {error}
        </div>
      )}

      {searched && !loading && (
        <div className="mb-6">
          <p className="text-text-secondary">
            搜索关键词 "<span className="font-medium text-text-primary">{query}</span>"，找到 <span className="font-medium text-text-primary">{results.length}</span> 篇相关文章
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">搜索中...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16 bg-surface rounded-xl border border-border">
          <svg
            className="w-16 h-16 text-border mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-text-primary mb-2">未找到相关文章</h3>
          <p className="text-text-secondary mb-4">请尝试使用其他关键词搜索</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-text-secondary">试试：</span>
            {popularSearches.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleQuickSearch(keyword)}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.slug}`}
              className="block bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {doc.category && (
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {doc.category.name}
                  </span>
                )}
                {doc.tags.slice(0, 3).map((dt) => (
                  <span
                    key={dt.tag.slug}
                    className="inline-block px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full"
                  >
                    {dt.tag.name}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                {doc.title}
              </h2>
              {doc.excerpt && (
                <p className="text-text-secondary mb-4">{truncateText(doc.excerpt, 200)}</p>
              )}
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <div className="flex items-center gap-4">
                  {doc.author && <span>作者: {doc.author.name}</span>}
                  <span>{formatDate(new Date(doc.createdAt))}</span>
                </div>
                <span>{doc.viewCount} 次阅读</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-4"></div>
        <p className="text-text-secondary">加载中...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
