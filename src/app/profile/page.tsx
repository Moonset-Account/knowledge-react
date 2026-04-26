'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Document {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  createdAt: string;
  viewCount: number;
  category: { id: string; name: string; slug: string } | null;
  _count: { comments: number; likes: number };
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  role: string | null;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<{
    user: UserProfile;
    documents: Document[];
    bookmarkCount: number;
    documentCount: number;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
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
    loadProfile();
  }, []);

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

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-surface rounded-xl border border-border p-8">
          <svg className="w-16 h-16 text-danger mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-text-primary mb-2">加载失败</h2>
          <p className="text-text-secondary mb-6">{error || '无法加载个人信息'}</p>
          <Link href="/login" className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const { user, documents, bookmarkCount, documentCount } = profile;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-xl border border-border p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.image ? (
              <img
                src={user.image}
                alt="头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-primary text-3xl font-bold">
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {user.name || '未设置昵称'}
            </h1>
            <p className="text-text-secondary mb-4">{user.email}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-text-secondary mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>注册于 {formatDate(new Date(user.createdAt))}</span>
              </div>
              {user.role && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{user.role === 'ADMIN' ? '管理员' : '普通用户'}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Link
                href="/profile/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                账号设置
              </Link>
              <Link
                href={`/authors/${user.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-background text-text-secondary border border-border rounded-lg hover:border-primary transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                公开主页
              </Link>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{documentCount}</div>
              <div className="text-sm text-text-secondary">发布文章</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{bookmarkCount}</div>
              <div className="text-sm text-text-secondary">收藏文章</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">我的文章</h2>
        {documents.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-8 text-center">
            <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-text-secondary mb-4">暂无发布的文章</p>
            <Link
              href="/admin/documents/new"
              className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
            >
              写第一篇文章
            </Link>
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
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                  {doc.category && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                      {doc.category.name}
                    </span>
                  )}
                  <span>{formatDate(new Date(doc.createdAt))}</span>
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
