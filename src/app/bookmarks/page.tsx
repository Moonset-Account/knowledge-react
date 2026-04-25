import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate, truncateText } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '我的收藏 - 知识库系统',
  description: '查看您收藏的文章',
};

const PAGE_SIZE = 10;

async function getBookmarkedDocuments(userId: string, params: { page?: string }) {
  const { page } = params;
  const currentPage = parseInt(page || '1');
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      include: {
        document: {
          include: {
            author: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            tags: { include: { tag: { select: { name: true, slug: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return { bookmarks, totalPages, currentPage, total };
}

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?callbackUrl=/bookmarks');
  }

  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams?.page || '';

  const { bookmarks, totalPages, currentPage, total } = await getBookmarkedDocuments(
    user.id,
    { page: pageParam }
  );

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getQueryString = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = {};
    if (pageParam && !overrides.page) params.page = pageParam;
    
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) {
        params[key] = String(value);
      } else {
        delete params[key];
      }
    });
    
    const searchString = new URLSearchParams(params).toString();
    return searchString ? `?${searchString}` : '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">我的收藏</h1>
        <p className="text-text-secondary">共收藏 {total} 篇文章</p>
      </div>

      {bookmarks.length > 0 ? (
        <>
          <div className="space-y-4">
            {bookmarks.map((bookmark) => {
              const doc = bookmark.document;
              return (
                <Link
                  key={bookmark.id}
                  href={`/documents/${doc.slug}`}
                  className="block bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    {doc.category && (
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {doc.category.name}
                      </span>
                    )}
                    {doc.tags.map((dt) => (
                      <span
                        key={dt.tagId}
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
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                    <span>{doc.viewCount} 次阅读</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {hasPrev && (
                <Link
                  href={`/bookmarks${getQueryString({ page: currentPage - 1 })}`}
                  className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors text-text-secondary"
                >
                  上一页
                </Link>
              )}
              <span className="px-4 py-2 text-text-secondary">
                {currentPage} / {totalPages}
              </span>
              {hasNext && (
                <Link
                  href={`/bookmarks${getQueryString({ page: currentPage + 1 })}`}
                  className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary transition-colors text-text-secondary"
                >
                  下一页
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
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
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-text-primary mb-2">暂无收藏</h3>
          <p className="text-text-secondary mb-6">您还没有收藏任何文章</p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            浏览文章
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
