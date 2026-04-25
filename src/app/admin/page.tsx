import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

async function getStats() {
  const [
    totalDocuments,
    publishedDocuments,
    draftDocuments,
    totalCategories,
    totalTags,
    totalUsers,
    totalViews,
    recentDocuments,
  ] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { published: true } }),
    prisma.document.count({ where: { published: false } }),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.user.count(),
    prisma.document.aggregate({ _sum: { viewCount: true } }),
    prisma.document.findMany({
      include: {
        author: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    totalDocuments,
    publishedDocuments,
    draftDocuments,
    totalCategories,
    totalTags,
    totalUsers,
    totalViews: totalViews._sum.viewCount || 0,
    recentDocuments,
  };
}

const statsCards = [
  {
    label: '总文章数',
    key: 'totalDocuments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    color: 'primary',
  },
  {
    label: '已发布',
    key: 'publishedDocuments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    color: 'success',
  },
  {
    label: '草稿',
    key: 'draftDocuments',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
    color: 'warning',
  },
  {
    label: '分类数',
    key: 'totalCategories',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    color: 'primary',
  },
  {
    label: '标签数',
    key: 'totalTags',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
    color: 'primary',
  },
  {
    label: '用户数',
    key: 'totalUsers',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    color: 'primary',
  },
  {
    label: '总阅读量',
    key: 'totalViews',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
    color: 'primary',
  },
];

const colorClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">仪表盘</h1>
        <p className="text-text-secondary">概览知识库的各项数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => (
          <div
            key={card.key}
            className="bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[card.color]}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-1">
              {stats[card.key as keyof typeof stats]}
            </div>
            <div className="text-sm text-text-secondary">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">最近文章</h2>
            <Link
              href="/admin/documents"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              查看全部 →
            </Link>
          </div>
        </div>
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
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.recentDocuments.length > 0 ? (
                stats.recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
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
                      {formatDateTime(doc.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    暂无文章
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
