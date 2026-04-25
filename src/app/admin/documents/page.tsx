import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 20;

async function getDocuments(params: {
  page?: string;
  search?: string;
}) {
  const { page, search } = params;
  const currentPage = parseInt(page || '1');
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.document.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return { documents, totalPages, currentPage, total };
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams?.page || '';
  const searchQuery = resolvedSearchParams?.search || '';

  const { documents, totalPages, currentPage, total } = await getDocuments({
    page: pageParam,
    search: searchQuery,
  });

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getQueryString = (overrides: Record<string, string | number>) => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">文章管理</h1>
          <p className="text-text-secondary">共 {total} 篇文章</p>
        </div>
        <Link
          href="/admin/documents/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          新建文章
        </Link>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  标题
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  分类
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  作者
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  阅读量
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  更新时间
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="font-medium text-text-primary hover:text-primary transition-colors"
                      >
                        {doc.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {doc.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {doc.author?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          doc.published
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {doc.published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {doc.viewCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {formatDateTime(doc.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/documents/${doc.id}`}
                          className="text-primary hover:text-primary-hover transition-colors"
                        >
                          编辑
                        </Link>
                        <span className="text-border">|</span>
                        <Link
                          href={`/documents/${doc.slug}`}
                          className="text-text-secondary hover:text-primary transition-colors"
                          target="_blank"
                        >
                          查看
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    暂无文章
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              {hasPrev && (
                <Link
                  href={`/admin/documents${getQueryString({ page: currentPage - 1 })}`}
                  className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                >
                  上一页
                </Link>
              )}
              {hasNext && (
                <Link
                  href={`/admin/documents${getQueryString({ page: currentPage + 1 })}`}
                  className="px-4 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors text-text-secondary text-sm"
                >
                  下一页
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
