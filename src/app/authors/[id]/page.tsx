'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface Document {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  category: { id: string; name: string; slug: string } | null;
  tags: { tagId: string; tag: { id: string; name: string; slug: string } }[];
  _count: { comments: number; likes: number };
}

interface Author {
  id: string;
  name: string | null;
  image: string | null;
  createdAt: string;
}

export default function AuthorPage() {
  const params = useParams();
  const authorId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    author: Author;
    documents: Document[];
    documentCount: number;
  } | null>(null);

  useEffect(() => {
    async function loadAuthor() {
      if (!authorId) return;
      
      try {
        const res = await fetch(`/api/authors/${authorId}`);
        if (res.ok) {
          const jsonData = await res.json();
          setData(jsonData);
        } else {
          const errData = await res.json();
          setError(errData.error || '加载失败');
        }
      } catch (err) {
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    }
    loadAuthor();
  }, [authorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-surface rounded-xl border border-border p-8">
          <svg className="w-16 h-16 text-danger mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-text-primary mb-2">作者不存在</h2>
          <p className="text-text-secondary mb-6">{error || '该作者不存在或已被删除'}</p>
          <Link href="/documents" className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
            浏览文章
          </Link>
        </div>
      </div>
    );
  }

  const { author, documents, documentCount } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-xl border border-border p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {author.image ? (
              <img
                src={author.image}
                alt="头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary text-2xl font-bold">
                {author.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {author.name || '匿名用户'}
            </h1>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-text-secondary mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>注册于 {formatDate(new Date(author.createdAt))}</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{documentCount}</div>
            <div className="text-sm text-text-secondary">发布文章</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">
          {author.name || '该作者'}的文章
        </h2>
        {documents.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-text-secondary">该作者暂无发布的文章</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.slug}`}
                className="block bg-surface rounded-xl border border-border p-6 hover:border-primary transition-colors"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-2 hover:text-primary transition-colors">
                  {doc.title}
                </h3>
                {doc.excerpt && (
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                    {doc.excerpt}
                  </p>
                )}
                
                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {doc.tags.map((dt) => (
                      <span
                        key={dt.tagId}
                        className="px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-full"
                      >
                        {dt.tag.name}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                  {doc.category && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                      {doc.category.name}
                    </span>
                  )}
                  <span>发布于 {formatDate(new Date(doc.createdAt))}</span>
                  <span>{doc.viewCount} 阅读</span>
                  <span>{doc._count.comments} 评论</span>
                  <span>{doc._count.likes} 点赞</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
